import type { ComplaintData } from "@/lib/validation/complaint";

export const STATUS = {
  pending: "लंबित",
  inProgress: "कार्य प्रगति पर",
  resolved: "समाधान हो गया",
} as const;

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
 * स्टोरेज इंटरफेस — आज Google Sheets, कल Postgres।
 * submit.ts केवल इसी इंटरफेस पर निर्भर है।
 */
export interface ComplaintRepository {
  create(record: ComplaintRecord): Promise<SavedComplaint>;
  setWhatsAppStatus(row: number, status: WaStatus): Promise<void>;
  /** जिनका WhatsApp विफल रहा — क्रॉन दोबारा भेजता है */
  listWhatsAppFailed(): Promise<SavedComplaint[]>;
}
