import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { formatIST } from "@/lib/utils/date";
import { getComplaintRepository } from "./repository";
import type { PublicIssue } from "./types";

export const ISSUES_CACHE_TAG = "public-issues";

export type PublicIssuesResult =
  | { ok: true; issues: PublicIssue[]; updatedAt: string }
  | { ok: false };

/**
 * स्थिति पेज का डेटा — शीट हर विज़िट पर नहीं पढ़ी जाती।
 * 'minutes' प्रोफ़ाइल: ~1 मिनट बाद अगली विज़िट पर बैकग्राउंड में ताज़ा होता है।
 * नई शिकायत दर्ज होते ही API रूट यह टैग revalidate करता है।
 */
export async function getPublicIssues(): Promise<PublicIssuesResult> {
  "use cache";
  cacheTag(ISSUES_CACHE_TAG);

  try {
    const repo = getComplaintRepository();
    if (!repo) throw new Error("repository not configured");
    const issues = await repo.listPublic();
    cacheLife("minutes");
    return { ok: true, issues, updatedAt: formatIST() };
  } catch (error) {
    console.error("[public-issues] load failed", error instanceof Error ? error.message : error);
    // त्रुटि ज़्यादा देर कैश न हो
    cacheLife("seconds");
    return { ok: false };
  }
}
