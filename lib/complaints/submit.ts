import "server-only";
import { getCategory } from "@/content/hi/categories";
import { complaintSchema } from "@/lib/validation/complaint";
import { formatIST } from "@/lib/utils/date";
import { uploadComplaintPhoto } from "@/lib/services/photo";
import { notifyRepresentative } from "@/lib/services/whatsapp";
import { verifyTurnstile } from "@/lib/services/turnstile";
import {
  checkIpLimit,
  checkMobileLimit,
  claimIdempotencyKey,
  completeIdempotencyKey,
  releaseIdempotencyKey,
} from "@/lib/services/ratelimit";
import { getComplaintRepository } from "./repository";
import { WA_STATUS, type SavedComplaint } from "./types";

export type SubmitErrorCode = "invalid" | "rate-limited" | "captcha" | "too-fast" | "in-progress" | "server";

export type SubmitResult =
  | { ok: true; id: string; saved?: SavedComplaint }
  | { ok: false; code: SubmitErrorCode; fieldErrors?: Record<string, string> };

const MIN_FILL_MS = 3_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PHOTO_REMARK: Record<string, string> = {
  "too-large": "फोटो बहुत बड़ी थी, सेव नहीं हुई",
  "not-image": "फोटो मान्य नहीं थी, सेव नहीं हुई",
  "not-configured": "फोटो स्टोरेज सेट नहीं है",
  "upload-failed": "फोटो अपलोड नहीं हुई",
};

/**
 * शिकायत दर्ज करने का पूरा क्रम (README → "Submission flow"):
 * स्पैम जांच → रेट लिमिट → डुप्लीकेट जांच → वैलिडेशन → फोटो → शीट (मुख्य रिकॉर्ड)।
 * WhatsApp यहां नहीं — रूट उसे after() में भेजता है ताकि उपयोगकर्ता को इंतज़ार न करना पड़े।
 */
export async function submitComplaint(formData: FormData, ip: string): Promise<SubmitResult> {
  // 1) स्पैम: छुपा हुआ honeypot फील्ड और बहुत जल्दी भरा गया फॉर्म
  if (String(formData.get("website") ?? "") !== "") return { ok: false, code: "invalid" };
  const startedAt = Number(formData.get("startedAt"));
  if (!startedAt || Date.now() - startedAt < MIN_FILL_MS) return { ok: false, code: "too-fast" };

  if (!(await verifyTurnstile(formData.get("cf-turnstile-response") as string | null, ip))) {
    return { ok: false, code: "captcha" };
  }
  if (!(await checkIpLimit(ip))) return { ok: false, code: "rate-limited" };

  // 2) वैलिडेशन — क्लाइंट वाला ही स्कीमा
  const parsed = complaintSchema.safeParse({
    name: formData.get("name") ?? "",
    mobile: formData.get("mobile") ?? "",
    village: formData.get("village") ?? "",
    villageOther: formData.get("villageOther") ?? "",
    category: formData.get("category") ?? "",
    description: formData.get("description") ?? "",
    location: formData.get("location") ?? "",
    mapLink: formData.get("mapLink") ?? "",
    consent: formData.get("consent") === "true",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, code: "invalid", fieldErrors };
  }
  const data = parsed.data;

  // 3) डुप्लीकेट सबमिशन
  const requestKey = String(formData.get("requestKey") ?? "");
  if (!UUID_RE.test(requestKey)) return { ok: false, code: "invalid" };
  const idem = await claimIdempotencyKey(requestKey);
  if (idem.state === "done") return { ok: true, id: idem.id };
  if (idem.state === "pending") return { ok: false, code: "in-progress" };

  try {
    if (!(await checkMobileLimit(data.mobile))) {
      await releaseIdempotencyKey(requestKey);
      return { ok: false, code: "rate-limited" };
    }

    const repo = getComplaintRepository();
    if (!repo) throw new Error("repository not configured");

    // 4) फोटो — वैकल्पिक है, इसलिए विफल होने पर भी शिकायत दर्ज होती है
    let photoUrl = "";
    let remark = "";
    const photo = formData.get("photo");
    if (photo instanceof File && photo.size > 0) {
      const result = await uploadComplaintPhoto(photo);
      if (result.ok) photoUrl = result.url;
      else remark = PHOTO_REMARK[result.reason];
    }

    // 5) शीट — यही मुख्य रिकॉर्ड है
    const saved = await repo.create({
      ...data,
      categoryLabel: getCategory(data.category)?.label ?? data.category,
      receivedAt: formatIST(),
      photoUrl,
      remark,
      idempotencyKey: requestKey,
    });

    await completeIdempotencyKey(requestKey, saved.id);
    console.info(`[complaints] saved ${saved.id}`);
    return { ok: true, id: saved.id, saved };
  } catch (error) {
    await releaseIdempotencyKey(requestKey).catch(() => {});
    console.error("[complaints] save failed", error instanceof Error ? error.message : error);
    return { ok: false, code: "server" };
  }
}

/** WhatsApp भेजें और नतीजा शीट में लिखें। after() और क्रॉन दोनों से चलता है। */
export async function notifyAndRecord(saved: SavedComplaint): Promise<void> {
  const repo = getComplaintRepository();
  const result = await notifyRepresentative(saved);
  const status =
    result === "sent" ? WA_STATUS.sent : result === "failed" ? WA_STATUS.failed : WA_STATUS.notConfigured;
  try {
    await repo?.setWhatsAppStatus(saved.row, status);
  } catch (error) {
    console.error(`[complaints] could not record WhatsApp status for ${saved.id}`, error instanceof Error ? error.message : error);
  }
}
