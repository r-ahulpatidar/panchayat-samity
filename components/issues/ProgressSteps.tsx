import { getStatus, progressSteps, type StatusId } from "@/content/hi/status";
import { statusTone } from "./StatusBadge";

/** दर्ज हुई → काम जारी → पूर्ण। "विभाग को भेजा गया" बीच वाले चरण पर दिखता है। */
export function ProgressSteps({ statusId }: { statusId: StatusId }) {
  const status = getStatus(statusId);
  const labels = progressSteps.map((label, i) => (i === 1 && statusId === "forwarded" ? "विभाग को भेजा" : label));

  return (
    <ol className="grid grid-cols-3" aria-label={`प्रगति: ${status.label}`}>
      {labels.map((label, i) => {
        const reached = i + 1 <= status.step;
        const current = i + 1 === status.step;
        return (
          <li key={label} className="relative flex flex-col items-center gap-1 text-center">
            {/* चरणों को जोड़ने वाली रेखा */}
            {i > 0 ? (
              <span
                aria-hidden="true"
                className={`absolute top-2 right-1/2 h-1 w-full -translate-y-1/2 ${reached ? statusTone[statusId].bar : "bg-line"}`}
              />
            ) : null}
            <span
              aria-hidden="true"
              className={`relative z-10 size-4 rounded-full ring-4 ring-white ${reached ? statusTone[statusId].dot : "bg-line"}`}
            />
            <span className={`text-sm leading-tight ${current ? "font-bold text-ink" : reached ? "text-ink" : "text-muted"}`}>
              {label}
              {current ? <span className="sr-only"> (वर्तमान स्थिति)</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
