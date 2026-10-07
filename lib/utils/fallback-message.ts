import { getCategory } from "@/content/hi/categories";
import { waMessage as m } from "@/content/hi/whatsapp";
import type { ComplaintData } from "@/lib/validation/complaint";

/** सर्वर विफल हो तो उपयोगकर्ता यही संदेश wa.me से खुद भेज सकता है — शिकायत खोती नहीं। */
export function buildFallbackMessage(d: Partial<ComplaintData>): string {
  const lines = [
    `*${m.heading}*`,
    "",
    `${m.name}: ${d.name ?? ""}`,
    `${m.mobile}: ${d.mobile ?? ""}`,
    `${m.village}: ${d.village ?? ""}`,
    `${m.category}: ${(d.category && getCategory(d.category)?.label) || ""}`,
    "",
    `*${m.description}:*`,
    d.description ?? "",
  ];
  const location = [d.location, d.mapLink].filter(Boolean).join(" ");
  if (location) lines.push("", `*${m.location}:*`, location);
  return lines.join("\n");
}
