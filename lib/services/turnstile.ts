import "server-only";
import { env } from "@/config/env";

/** Cloudflare Turnstile — सीक्रेट सेट न हो तो जांच छोड़ दी जाती है (लोकल डेवलपमेंट)। */
export async function verifyTurnstile(token: string | null, ip?: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8_000),
    });
    const data = (await res.json()) as { success: boolean };
    return data.success;
  } catch {
    // Cloudflare डाउन हो तो असली उपयोगकर्ता न रुकें — रेट लिमिट फिर भी लागू है
    console.error("[turnstile] verify request failed; allowing");
    return true;
  }
}
