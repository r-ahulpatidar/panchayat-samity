import { categories, type CategoryId } from "@/content/hi/categories";
import { statusFromSheet } from "@/content/hi/status";
import type { PublicIssue } from "./types";

/** विवरण में लिखे मोबाइल नंबर सार्वजनिक पेज पर छुपाएं: "98765 43210" → "XXXXXXXXXX" */
export function maskPhoneNumbers(text: string): string {
  return text.replace(/(?:\+?91[\s-]?)?(?<!\d)[6-9]\d(?:[\s-]?\d){8}(?!\d)/g, "XXXXXXXXXX");
}

/**
 * केवल हमारे Vercel Blob स्टोर की शिकायत-फोटो (next.config.ts के remotePatterns से मेल)।
 * शीट में कोई दूसरा लिंक लिख दे तो वह वेबसाइट पर नहीं दिखेगा।
 */
export function isComplaintPhotoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      u.hostname.endsWith(".public.blob.vercel-storage.com") &&
      u.pathname.startsWith("/complaints/") &&
      u.search === ""
    );
  } catch {
    return false;
  }
}

export function categoryIdFromLabel(label: string): CategoryId {
  return categories.find((c) => c.label === label)?.id ?? "anya";
}

type RawRow = {
  id: string;
  receivedAt: string;
  village: string;
  categoryLabel: string;
  description: string;
  status: string;
  publicNote: string;
  photoUrl: string;
};

/** शीट/स्टोर की पंक्तियां → सार्वजनिक सूची (छुपाई गई हटाकर, नई पहले) */
export function toPublicIssues(rows: RawRow[]): PublicIssue[] {
  return rows
    .filter((r) => r.id && statusFromSheet(r.status).visible)
    .map((r) => ({
      id: r.id,
      receivedDate: r.receivedAt.split(",")[0].trim(),
      village: r.village,
      categoryId: categoryIdFromLabel(r.categoryLabel),
      description: maskPhoneNumbers(r.description),
      statusId: statusFromSheet(r.status).id,
      publicNote: maskPhoneNumbers(r.publicNote.trim()),
      photoUrl: isComplaintPhotoUrl(r.photoUrl.trim()) ? r.photoUrl.trim() : "",
    }))
    .reverse();
}
