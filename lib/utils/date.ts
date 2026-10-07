const istFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "07/10/2026, 14:32" (भारतीय समय) */
export function formatIST(date: Date = new Date()): string {
  return istFormatter.format(date);
}
