import "server-only";
import { z } from "zod";

/**
 * सर्वर-साइड एनवायरनमेंट वेरिएबल। हर इंटीग्रेशन अलग से "configured" है या नहीं,
 * ताकि लोकल डेवलपमेंट बिना किसी क्रेडेंशियल के चल सके (README देखें)।
 * प्रोडक्शन में Google Sheets ज़रूरी है — बाकी (WhatsApp, Blob, Upstash, Turnstile) वैकल्पिक हैं।
 */

const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  GOOGLE_SERVICE_ACCOUNT_EMAIL: optional,
  GOOGLE_PRIVATE_KEY: optional,
  GOOGLE_SHEET_ID: optional,
  GOOGLE_SHEET_TAB: z.string().default("शिकायतें"),

  WHATSAPP_TOKEN: optional,
  WHATSAPP_PHONE_NUMBER_ID: optional,
  WHATSAPP_TEMPLATE_TEXT: z.string().default("nai_jan_samasya"),
  WHATSAPP_TEMPLATE_IMAGE: z.string().default("nai_jan_samasya_photo"),
  WHATSAPP_TEMPLATE_LANG: z.string().default("hi"),
  WHATSAPP_RECIPIENTS: optional,
  WHATSAPP_API_VERSION: z.string().default("v21.0"),

  BLOB_READ_WRITE_TOKEN: optional,

  UPSTASH_REDIS_REST_URL: optional,
  UPSTASH_REDIS_REST_TOKEN: optional,
  // Vercel Marketplace (Upstash) इन नामों से भी वेरिएबल देता है
  KV_REST_API_URL: optional,
  KV_REST_API_TOKEN: optional,

  TURNSTILE_SECRET_KEY: optional,
  CRON_SECRET: optional,

  COMPLAINT_ID_PREFIX: z.string().default("JK-2026"),
});

const parsed = schema.parse(process.env);

export const env = {
  ...parsed,
  isProd: parsed.NODE_ENV === "production",

  sheets:
    parsed.GOOGLE_SERVICE_ACCOUNT_EMAIL && parsed.GOOGLE_PRIVATE_KEY && parsed.GOOGLE_SHEET_ID
      ? {
          email: parsed.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          // Vercel में की "\n" के साथ एक लाइन में रखी जाती है; पेस्ट करते समय बचे कोट भी हटाते हैं
          privateKey: parsed.GOOGLE_PRIVATE_KEY.replace(/^"|"$/g, "").replace(/\\n/g, "\n"),
          sheetId: parsed.GOOGLE_SHEET_ID,
          tab: parsed.GOOGLE_SHEET_TAB,
        }
      : undefined,

  whatsapp:
    parsed.WHATSAPP_TOKEN && parsed.WHATSAPP_PHONE_NUMBER_ID && parsed.WHATSAPP_RECIPIENTS
      ? {
          token: parsed.WHATSAPP_TOKEN,
          phoneNumberId: parsed.WHATSAPP_PHONE_NUMBER_ID,
          recipients: parsed.WHATSAPP_RECIPIENTS.split(",").map((n) => n.replace(/\D/g, "")).filter(Boolean),
          templateText: parsed.WHATSAPP_TEMPLATE_TEXT,
          templateImage: parsed.WHATSAPP_TEMPLATE_IMAGE,
          lang: parsed.WHATSAPP_TEMPLATE_LANG,
          apiVersion: parsed.WHATSAPP_API_VERSION,
        }
      : undefined,

  redis: (() => {
    const url = parsed.UPSTASH_REDIS_REST_URL ?? parsed.KV_REST_API_URL;
    const token = parsed.UPSTASH_REDIS_REST_TOKEN ?? parsed.KV_REST_API_TOKEN;
    return url && token ? { url, token } : undefined;
  })(),
};
