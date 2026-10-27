import { ButtonLink } from "@/components/ui/ButtonLink";
import { issuesPage as t } from "@/content/hi/status";
import { getPublicIssues } from "@/lib/complaints/public-issues";
import { IssueExplorer } from "./IssueExplorer";

/** सर्वर पर कैश्ड डेटा पढ़ता है; फ़िल्टर/खोज क्लाइंट पर (केवल सार्वजनिक फ़ील्ड भेजे जाते हैं) */
export async function IssueBoard() {
  const result = await getPublicIssues();

  if (!result.ok) {
    return <p className="rounded-2xl bg-danger-soft p-6 text-center font-semibold text-danger">{t.loadError}</p>;
  }

  if (result.issues.length === 0) {
    return (
      <div className="space-y-4 rounded-2xl bg-white p-6 text-center ring-1 ring-line">
        <p className="text-muted">{t.noIssues}</p>
        <ButtonLink href="/samasya-batayen">{t.cta}</ButtonLink>
      </div>
    );
  }

  return (
    <>
      <IssueExplorer issues={result.issues} />
      <p className="mt-6 text-center text-base text-muted">
        {t.lastUpdated}: {result.updatedAt} · {t.updatesNote}
      </p>
    </>
  );
}

export function IssueBoardSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-3">
      <div className="h-20 animate-pulse rounded-2xl bg-white ring-1 ring-line" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-white ring-1 ring-line" />
        ))}
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-44 animate-pulse rounded-2xl bg-white ring-1 ring-line" />
      ))}
    </div>
  );
}
