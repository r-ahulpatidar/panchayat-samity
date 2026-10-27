import type { Metadata } from "next";
import { Suspense } from "react";
import { IssueBoard, IssueBoardSkeleton } from "@/components/issues/IssueBoard";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { PageHeading } from "@/components/ui/PageHeading";
import { issuesPage } from "@/content/hi/status";

export const metadata: Metadata = {
  title: issuesPage.metaTitle,
  description: issuesPage.metaDescription,
};

export default function IssuesStatusPage() {
  return (
    <>
      <PageHeading title={issuesPage.title} intro={issuesPage.intro} />
      <Suspense fallback={<IssueBoardSkeleton />}>
        <IssueBoard />
      </Suspense>
      <StickyCTA />
    </>
  );
}
