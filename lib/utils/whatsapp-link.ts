/** wa.me लिंक — उपयोगकर्ता का अपना WhatsApp खुलता है, संदेश पहले से भरा होता है। */
export function waLink(number: string, text?: string): string {
  const base = `https://wa.me/${number.replace(/\D/g, "")}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
