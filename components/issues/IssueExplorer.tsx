"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { OTHER_VILLAGE, site } from "@/content/hi/site";
import { issuesPage as t, statuses, type StatusId } from "@/content/hi/status";
import type { PublicIssue } from "@/lib/complaints/types";
import { inputClass } from "@/components/form/Field";
import { IssueCard } from "./IssueCard";
import { statusTone } from "./StatusBadge";

const PAGE_SIZE = 20;
const visibleStatuses = statuses.filter((s) => s.visible);
const noopSubscribe = () => () => {};

/** "खेड़ली (अन्य)" जैसे सूची से बाहर के गांव "अन्य" फ़िल्टर में आते हैं */
const matchesVillage = (issue: PublicIssue, village: string) =>
  village === "all" ||
  (village === OTHER_VILLAGE ? !(site.villages as readonly string[]).includes(issue.village) : issue.village === village);

export function IssueExplorer({ issues }: { issues: PublicIssue[] }) {
  const [status, setStatus] = useState<StatusId | "all">("all");
  const [village, setVillage] = useState("all");
  const [query, setQuery] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);

  // सफलता पेज से ?id=JK-2026-0012 के साथ आए हों तो वही शिकायत खोजें (पेज स्टैटिक रहता है)
  const urlId = useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get("id") ?? "",
    () => "",
  );
  const search = (query ?? urlId).trim().toUpperCase();

  const counts = useMemo(() => {
    const byStatus = Object.fromEntries(visibleStatuses.map((s) => [s.id, 0])) as Record<StatusId, number>;
    for (const issue of issues) byStatus[issue.statusId] = (byStatus[issue.statusId] ?? 0) + 1;
    return byStatus;
  }, [issues]);

  const filtered = useMemo(
    () =>
      issues.filter(
        (i) =>
          (status === "all" || i.statusId === status) &&
          matchesVillage(i, village) &&
          (!search || i.id.toUpperCase().includes(search)),
      ),
    [issues, status, village, search],
  );

  const doneShare = issues.length ? Math.round((counts.done / issues.length) * 100) : 0;
  const shown = filtered.slice(0, limit);

  function pickStatus(next: StatusId | "all") {
    setStatus(next);
    setLimit(PAGE_SIZE);
  }

  return (
    <div className="space-y-6">
      {/* सारांश — टाइल पर टैप करने से उसी स्थिति की समस्याएं दिखती हैं */}
      <section aria-label={t.filterStatus} className="space-y-3">
        <div className="space-y-2 rounded-2xl bg-white p-4 ring-1 ring-line">
          <p className="font-semibold">{t.doneShare(counts.done, issues.length)}</p>
          <div
            className="h-3 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={doneShare}
            aria-label={t.doneShare(counts.done, issues.length)}
          >
            <div className="h-full rounded-full bg-green" style={{ width: `${doneShare}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <SummaryTile
            label={t.all}
            count={issues.length}
            active={status === "all"}
            onClick={() => pickStatus("all")}
            className="col-span-2 sm:col-span-1"
          />
          {visibleStatuses.map((s) => (
            <SummaryTile
              key={s.id}
              label={s.label}
              count={counts[s.id]}
              active={status === s.id}
              dotClass={statusTone[s.id].dot}
              onClick={() => pickStatus(s.id)}
            />
          ))}
        </div>
      </section>

      {/* खोज और गांव फ़िल्टर */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="issue-search" className="block font-semibold">
            {t.searchLabel}
          </label>
          <div className="flex gap-2">
            <input
              id="issue-search"
              type="search"
              inputMode="text"
              autoCapitalize="characters"
              placeholder={t.searchPlaceholder}
              value={query ?? urlId}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(PAGE_SIZE);
              }}
              className={inputClass(false)}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="min-h-14 shrink-0 rounded-xl border-2 border-line bg-white px-4 font-semibold"
              >
                {t.clear}
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="issue-village" className="block font-semibold">
            {t.filterVillage}
          </label>
          <select
            id="issue-village"
            value={village}
            onChange={(e) => {
              setVillage(e.target.value);
              setLimit(PAGE_SIZE);
            }}
            className={inputClass(false)}
          >
            <option value="all">{t.allVillages}</option>
            {site.villages.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
            <option value={OTHER_VILLAGE}>अन्य गांव</option>
          </select>
        </div>
      </section>

      {/* सूची */}
      <section aria-live="polite" className="space-y-3">
        {filtered.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-muted ring-1 ring-line">
            {search ? t.notFoundId : t.empty}
          </p>
        ) : (
          <>
            <p className="text-base text-muted">{t.showing(shown.length, filtered.length)}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {shown.map((issue) => (
                <IssueCard key={issue.id} issue={issue} highlight={Boolean(search) && issue.id.toUpperCase() === search} />
              ))}
            </div>
            {filtered.length > shown.length ? (
              <button
                type="button"
                onClick={() => setLimit((l) => l + PAGE_SIZE)}
                className="flex min-h-14 w-full items-center justify-center rounded-xl border-2 border-brand bg-white text-lg font-semibold text-brand"
              >
                {t.showMore}
              </button>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

function SummaryTile({
  label,
  count,
  active,
  dotClass,
  onClick,
  className = "",
}: {
  label: string;
  count: number;
  active: boolean;
  dotClass?: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-20 flex-col items-start justify-center rounded-2xl px-4 py-3 text-left ring-1 ${
        active ? "bg-brand-soft ring-2 ring-brand" : "bg-white ring-line"
      } ${className}`}
    >
      <span className="text-2xl font-bold">{count}</span>
      <span className="flex items-center gap-1.5 text-base leading-snug text-muted">
        {dotClass ? <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${dotClass}`} /> : null}
        {label}
      </span>
    </button>
  );
}
