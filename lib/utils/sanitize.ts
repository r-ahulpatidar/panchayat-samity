/**
 * शीट में लिखने से पहले — फॉर्मूला इंजेक्शन से बचाव (CSV एक्सपोर्ट के समय भी)।
 * शुरुआत के = + @ और टैब/कैरिज रिटर्न हटाए जाते हैं।
 */
export function sheetSafe(value: string): string {
  return value.replace(/^[=+@\t\r]+/, "").trim();
}

/** WhatsApp टेम्पलेट पैरामीटर में नई लाइन, टैब और 4+ लगातार स्पेस की अनुमति नहीं है। */
export function waParam(value: string, maxLength = 900, suffix = "…"): string {
  const flat = value
    .replace(/\s*[\r\n]+\s*/g, " | ")
    .replace(/\t/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();
  if (flat.length <= maxLength) return flat || "-";
  return flat.slice(0, maxLength - suffix.length).trimEnd() + suffix;
}
