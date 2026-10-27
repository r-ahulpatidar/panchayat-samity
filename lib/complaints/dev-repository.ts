import "server-only";
import { DEFAULT_STATUS } from "@/content/hi/status";
import { complaintIdFromRow } from "@/lib/utils/complaint-id";
import { toPublicIssues } from "./public";
import type { ComplaintRepository, SavedComplaint } from "./types";

/**
 * केवल लोकल डेवलपमेंट के लिए — Google Sheets सेट न होने पर शिकायतें मेमोरी में
 * रखी जाती हैं और टर्मिनल में दिखती हैं। प्रोडक्शन में कभी उपयोग नहीं होता।
 */
const store: SavedComplaint[] = [];

export function createDevRepository(idPrefix: string): ComplaintRepository {
  return {
    async create(record) {
      const row = store.length + 2;
      const saved = { ...record, id: complaintIdFromRow(idPrefix, row), row };
      store.push(saved);
      console.info("[dev-repository] नई शिकायत (शीट सेट नहीं है):", saved);
      return saved;
    },
    async setWhatsAppStatus(row, status) {
      console.info(`[dev-repository] पंक्ति ${row} → WhatsApp स्थिति: ${status}`);
    },
    async listWhatsAppFailed() {
      return [];
    },
    async listPublic() {
      return toPublicIssues(
        store.map((c) => ({ ...c, status: DEFAULT_STATUS.label, publicNote: "" })),
      );
    },
  };
}
