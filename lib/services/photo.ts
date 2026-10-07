import "server-only";
import { put } from "@vercel/blob";
import { env } from "@/config/env";

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // ब्राउज़र में कंप्रेस होने के बाद

const SIGNATURES: { mime: string; ext: string; test: (b: Uint8Array) => boolean }[] = [
  { mime: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: "image/png",
    ext: "png",
    test: (b) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v),
  },
  {
    mime: "image/webp",
    ext: "webp",
    // "RIFF" .... "WEBP"
    test: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
];

/** ब्राउज़र का बताया MIME टाइप भरोसेमंद नहीं — फाइल के शुरुआती बाइट (magic bytes) जांचते हैं। */
export function sniffImage(bytes: Uint8Array) {
  return SIGNATURES.find((s) => s.test(bytes));
}

export type PhotoResult =
  | { ok: true; url: string }
  | { ok: false; reason: "too-large" | "not-image" | "not-configured" | "upload-failed" };

export async function uploadComplaintPhoto(file: File): Promise<PhotoResult> {
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, reason: "too-large" };

  const bytes = Buffer.from(await file.arrayBuffer());
  const type = sniffImage(bytes);
  if (!type) return { ok: false, reason: "not-image" };

  if (!env.BLOB_READ_WRITE_TOKEN) return { ok: false, reason: "not-configured" };

  try {
    // उपयोगकर्ता का फाइल नाम कभी उपयोग नहीं होता
    const year = new Date().getFullYear();
    const blob = await put(`complaints/${year}/${crypto.randomUUID()}.${type.ext}`, bytes, {
      access: "public",
      contentType: type.mime,
      addRandomSuffix: true,
      token: env.BLOB_READ_WRITE_TOKEN,
    });
    return { ok: true, url: blob.url };
  } catch (error) {
    console.error("[photo] upload failed", error instanceof Error ? error.message : error);
    return { ok: false, reason: "upload-failed" };
  }
}
