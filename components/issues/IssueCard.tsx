import { getCategory } from "@/content/hi/categories";
import { issuesPage as t } from "@/content/hi/status";
import type { PublicIssue } from "@/lib/complaints/types";
import { IssuePhoto } from "./IssuePhoto";
import { ProgressSteps } from "./ProgressSteps";
import { StatusBadge } from "./StatusBadge";

export function IssueCard({ issue, highlight = false }: { issue: PublicIssue; highlight?: boolean }) {
  const category = getCategory(issue.categoryId);

  return (
    <article
      id={issue.id}
      className={`space-y-3 rounded-2xl bg-white p-4 ring-1 ${highlight ? "ring-2 ring-brand" : "ring-line"}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-bold tracking-wide">{issue.id}</h3>
        <StatusBadge statusId={issue.statusId} />
      </header>

      <p className="flex flex-wrap items-center gap-x-2 text-base text-muted">
        <span className="font-semibold text-ink">
          <span aria-hidden="true">{category?.icon} </span>
          {category?.label}
        </span>
        <span aria-hidden="true">·</span>
        <span>{issue.village}</span>
        <span aria-hidden="true">·</span>
        <span>
          {t.received} {issue.receivedDate}
        </span>
      </p>

      <p className="line-clamp-4 whitespace-pre-line">{issue.description}</p>

      {issue.photoUrl ? (
        <IssuePhoto src={issue.photoUrl} alt={`${t.photoAlt}: ${category?.label ?? ""}, ${issue.village}`} />
      ) : null}

      <ProgressSteps statusId={issue.statusId} />

      {issue.publicNote ? (
        <p className="rounded-xl bg-brand-soft p-3 text-base">
          <span className="font-bold text-brand-dark">📢 {t.update}: </span>
          {issue.publicNote}
        </p>
      ) : null}
    </article>
  );
}
