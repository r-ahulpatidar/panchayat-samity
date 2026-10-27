import type { CategoryId } from "@/content/hi/categories";
import type { StatusId } from "@/content/hi/status";
import type { ComplaintData } from "@/lib/validation/complaint";

export const WA_STATUS = {
  sent: "भेजा गया",
  failed: "विफल",
  notConfigured: "WhatsApp सेट नहीं",
} as const;
export type WaStatus = (typeof WA_STATUS)[keyof typeof WA_STATUS];

/** शीट में सेव होने वाला पूरा रिकॉर्ड */
export type ComplaintRecord = ComplaintData & {
  receivedAt: string; // IST में फॉर्मेट की हुई तारीख
  categoryLabel: string;
  photoUrl: string;
  remark: string;
  idempotencyKey: string;
};

export type SavedComplaint = ComplaintRecord & { id: string; row: number };

/**
 * "समस्याओं की स्थिति" पेज पर दिखने वाली जानकारी — केवल सार्वजनिक फ़ील्ड।
 * नाम, मोबाइल और सटीक स्थान यहां कभी नहीं आते।
 */
export type PublicIssue = {
  id: string;
  receivedDate: string; // "08/10/2026"
  village: string;
  categoryId: CategoryId;
  description: string; // मोबाइल नंबर छुपाकर
  statusId: StatusId;
  publicNote: string;
  photoUrl: string; // "" = फोटो नहीं; केवल हमारे Vercel Blob स्टोर के लिंक
};

/**
 * स्टोरेज इंटरफेस — आज Google Sheets, कल Postgres।
 * submit.ts केवल इसी इंटरफेस पर निर्भर है।
 */
export interface ComplaintRepository {
  create(record: ComplaintRecord): Promise<SavedComplaint>;
  setWhatsAppStatus(row: number, status: WaStatus): Promise<void>;
  /** जिनका WhatsApp विफल रहा — क्रॉन दोबारा भेजता है */
  listWhatsAppFailed(): Promise<SavedComplaint[]>;
  /** स्थिति पेज के लिए — "छुपाएं" वाली शिकायतें शामिल नहीं, नई सबसे पहले */
  listPublic(): Promise<PublicIssue[]>;
}
