import "server-only";
import { JWT } from "google-auth-library";
import { DEFAULT_STATUS } from "@/content/hi/status";
import { categoryIdFromLabel, toPublicIssues } from "@/lib/complaints/public";
import { complaintIdFromRow, rowFromRange } from "@/lib/utils/complaint-id";
import { sheetSafe } from "@/lib/utils/sanitize";
import {
  WA_STATUS,
  type ComplaintRecord,
  type ComplaintRepository,
  type SavedComplaint,
  type WaStatus,
} from "@/lib/complaints/types";

/**
 * शीट का कॉलम क्रम (पंक्ति 1 = हेडर)। README में हेडर की पूरी सूची है।
 * A आईडी | B तारीख | C नाम | D मोबाइल | E गांव | F श्रेणी | G विवरण
 * H स्थान | I फोटो URL | J स्थिति | K टिप्पणी (आंतरिक) | L WhatsApp स्थिति | M अनुरोध कुंजी
 * N वेबसाइट पर टिप्पणी — स्टाफ भरता है, "समस्याओं की स्थिति" पेज पर दिखती है
 */
export const SHEET_HEADERS = [
  "शिकायत आईडी",
  "प्राप्ति तिथि",
  "नाम",
  "मोबाइल नंबर",
  "गांव",
  "श्रेणी",
  "विवरण",
  "स्थान",
  "फोटो URL",
  "स्थिति",
  "टिप्पणी (आंतरिक)",
  "WhatsApp स्थिति",
  "अनुरोध कुंजी",
  "वेबसाइट पर टिप्पणी",
] as const;

const WA_STATUS_COLUMN = "L";
const API = "https://sheets.googleapis.com/v4/spreadsheets";

type Config = { email: string; privateKey: string; sheetId: string; tab: string; idPrefix: string };

export function createSheetsRepository(config: Config): ComplaintRepository {
  const auth = new JWT({
    email: config.email,
    key: config.privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  // हिंदी टैब नाम को कोट करना ज़रूरी है: 'शिकायतें'!A:M
  const range = (a1: string) => encodeURIComponent(`'${config.tab}'!${a1}`);
  const base = `${API}/${config.sheetId}/values`;

  async function request<T>(url: string, method: "GET" | "POST" | "PUT", data?: unknown): Promise<T> {
    const res = await auth.request<T>({ url, method, data, timeout: 15_000 });
    return res.data;
  }

  function toRow(r: ComplaintRecord): string[] {
    const location = [r.location, r.mapLink].filter(Boolean).join(" ");
    return [
      "", // आईडी append के बाद लिखी जाती है
      r.receivedAt,
      sheetSafe(r.name),
      r.mobile,
      sheetSafe(r.village),
      r.categoryLabel,
      sheetSafe(r.description),
      sheetSafe(location),
      r.photoUrl,
      DEFAULT_STATUS.label,
      r.remark,
      "",
      r.idempotencyKey,
    ];
  }

  return {
    async create(record) {
      // 1) पंक्ति जोड़ें — RAW ताकि कोई भी इनपुट फॉर्मूला की तरह न चले
      const appended = await request<{ updates: { updatedRange: string } }>(
        `${base}/${range("A:M")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        "POST",
        { values: [toRow(record)] },
      );

      // 2) लौटे हुए रेंज से पंक्ति संख्या → आईडी
      const row = rowFromRange(appended.updates.updatedRange);
      const id = complaintIdFromRow(config.idPrefix, row);

      // 3) आईडी उसी पंक्ति में लिखें
      await request(`${base}/${range(`A${row}`)}?valueInputOption=RAW`, "PUT", { values: [[id]] });

      return { ...record, id, row };
    },

    async setWhatsAppStatus(row, status: WaStatus) {
      await request(`${base}/${range(`${WA_STATUS_COLUMN}${row}`)}?valueInputOption=RAW`, "PUT", {
        values: [[status]],
      });
    },

    async listWhatsAppFailed() {
      const res = await request<{ values?: string[][] }>(`${base}/${range("A2:M")}`, "GET");
      const rows = res.values ?? [];
      const failed: SavedComplaint[] = [];

      rows.forEach((v, i) => {
        if (v[11] !== WA_STATUS.failed || !v[0]) return;
        const categoryLabel = v[5] ?? "";
        const categoryId = categoryIdFromLabel(categoryLabel);
        failed.push({
          id: v[0],
          row: i + 2,
          receivedAt: v[1] ?? "",
          name: v[2] ?? "",
          mobile: v[3] ?? "",
          village: v[4] ?? "",
          category: categoryId,
          categoryLabel,
          description: v[6] ?? "",
          location: v[7] ?? "",
          mapLink: "",
          photoUrl: v[8] ?? "",
          remark: v[10] ?? "",
          idempotencyKey: v[12] ?? "",
          consent: true,
        });
      });
      return failed;
    },

    async listPublic() {
      const res = await request<{ values?: string[][] }>(`${base}/${range("A2:N")}`, "GET");
      return toPublicIssues(
        (res.values ?? []).map((v) => ({
          id: v[0] ?? "",
          receivedAt: v[1] ?? "",
          village: v[4] ?? "",
          categoryLabel: v[5] ?? "",
          description: v[6] ?? "",
          status: v[9] ?? "",
          publicNote: v[13] ?? "",
          photoUrl: v[8] ?? "",
        })),
      );
    },
  };
}
