import { getStatus, type StatusId } from "@/content/hi/status";

/** हर स्थिति का अपना रंग — बैज, सारांश टाइल और स्टेपर में एक जैसा */
export const statusTone: Record<StatusId, { badge: string; dot: string; bar: string }> = {
  pending: { badge: "bg-amber-50 text-amber-800 ring-amber-300", dot: "bg-amber-500", bar: "bg-amber-500" },
  "in-progress": { badge: "bg-blue-50 text-blue-800 ring-blue-300", dot: "bg-blue-600", bar: "bg-blue-600" },
  forwarded: { badge: "bg-violet-50 text-violet-800 ring-violet-300", dot: "bg-violet-600", bar: "bg-violet-600" },
  done: { badge: "bg-green-soft text-green-dark ring-green-300", dot: "bg-green", bar: "bg-green" },
  hidden: { badge: "bg-stone-100 text-stone-600 ring-stone-300", dot: "bg-stone-400", bar: "bg-stone-400" },
};

export function StatusBadge({ statusId }: { statusId: StatusId }) {
  const status = getStatus(statusId);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-base font-semibold ring-1 ${statusTone[statusId].badge}`}
    >
      <span aria-hidden="true" className={`size-2 rounded-full ${statusTone[statusId].dot}`} />
      {status.label}
    </span>
  );
}
