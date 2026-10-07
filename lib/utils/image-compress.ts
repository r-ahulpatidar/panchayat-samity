// ब्राउज़र में फोटो छोटी करना: 6 MB की फोटो → ~300 KB JPEG।
// canvas से दोबारा बनाने पर EXIF (GPS लोकेशन सहित) अपने आप हट जाता है।

const MAX_SIDE = 1600;
const QUALITY = 0.7;

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { source: bitmap, width: bitmap.width, height: bitmap.height };
  } catch {
    // पुराने ब्राउज़र के लिए
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return { source: img, width: img.naturalWidth, height: img.naturalHeight };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export async function compressImage(file: File): Promise<File> {
  const { source, width, height } = await decode(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.fillStyle = "#fff"; // PNG की पारदर्शिता काली न दिखे
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
  if (!blob) throw new Error("compression failed");
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}
