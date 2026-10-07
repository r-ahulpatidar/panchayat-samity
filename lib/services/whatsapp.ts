import "server-only";
import { env } from "@/config/env";
import { waMessage } from "@/content/hi/whatsapp";
import { waParam } from "@/lib/utils/sanitize";
import type { SavedComplaint } from "@/lib/complaints/types";

/**
 * WhatsApp Business Cloud API — प्रतिनिधि को अप्रूव्ड टेम्पलेट संदेश भेजता है।
 *
 * टेम्पलेट (Meta WhatsApp Manager में, भाषा: Hindi, श्रेणी: Utility) के बॉडी पैरामीटर:
 *  {{1}} आईडी  {{2}} नाम  {{3}} मोबाइल  {{4}} गांव  {{5}} श्रेणी
 *  {{6}} विवरण  {{7}} स्थान  {{8}} तारीख
 * फोटो हो तो WHATSAPP_TEMPLATE_IMAGE (IMAGE हेडर वाला) टेम्पलेट उपयोग होता है।
 */
export function buildTemplateParams(c: SavedComplaint): string[] {
  const location = [c.location, c.mapLink].filter(Boolean).join(" ");
  return [
    c.id,
    c.name,
    c.mobile,
    c.village,
    c.categoryLabel,
    c.description,
    location || "-",
    c.receivedAt,
  ].map((v, i) => (i === 5 ? waParam(v, 900, waMessage.truncated) : waParam(v, 200)));
}

export type WhatsAppResult = "sent" | "failed" | "not-configured";

export async function notifyRepresentative(c: SavedComplaint): Promise<WhatsAppResult> {
  const wa = env.whatsapp;
  if (!wa) return "not-configured";

  const params = buildTemplateParams(c).map((text) => ({ type: "text", text }));
  const withPhoto = Boolean(c.photoUrl);
  const components: unknown[] = [{ type: "body", parameters: params }];
  if (withPhoto) {
    components.unshift({ type: "header", parameters: [{ type: "image", image: { link: c.photoUrl } }] });
  }

  const results = await Promise.all(
    wa.recipients.map(async (to) => {
      try {
        const res = await fetch(`https://graph.facebook.com/${wa.apiVersion}/${wa.phoneNumberId}/messages`, {
          method: "POST",
          headers: { Authorization: `Bearer ${wa.token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "template",
            template: {
              name: withPhoto ? wa.templateImage : wa.templateText,
              language: { code: wa.lang },
              components,
            },
          }),
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) {
          // बॉडी में PII नहीं होती, केवल Meta का error code
          const body = await res.text().catch(() => "");
          console.error(`[whatsapp] ${c.id} → HTTP ${res.status} ${body.slice(0, 300)}`);
        }
        return res.ok;
      } catch (error) {
        console.error(`[whatsapp] ${c.id} → ${error instanceof Error ? error.name : "error"}`);
        return false;
      }
    }),
  );

  return results.every(Boolean) ? "sent" : "failed";
}
