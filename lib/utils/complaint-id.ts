/**
 * शीट की पंक्ति संख्या से शिकायत आईडी बनती है। पंक्ति 1 हेडर है,
 * इसलिए पंक्ति 2 → JK-2026-0001। append एक पंक्ति के लिए atomic है, इसलिए
 * एक साथ आई दो शिकायतों को कभी एक ही आईडी नहीं मिलती।
 */
export function complaintIdFromRow(prefix: string, row: number): string {
  return `${prefix}-${String(row - 1).padStart(4, "0")}`;
}

/** "'शिकायतें'!A43:N43" → 43 */
export function rowFromRange(range: string): number {
  const match = range.match(/![A-Z]+(\d+)/);
  if (!match) throw new Error(`Cannot parse row from range: ${range}`);
  return Number(match[1]);
}
