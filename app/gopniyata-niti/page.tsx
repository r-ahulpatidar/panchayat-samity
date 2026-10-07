import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/PageHeading";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { privacy } from "@/content/hi/privacy";
import { site } from "@/content/hi/site";

export const metadata: Metadata = {
  title: privacy.metaTitle,
  description: privacy.metaDescription,
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading title={privacy.title} intro={privacy.updated} />
      <div className="space-y-6">
        {privacy.sections.map((s) => (
          <section key={s.title} className="space-y-1">
            <h2 className="text-xl font-bold">{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
        <p className="rounded-xl bg-white p-4 ring-1 ring-line">
          {privacy.contactLine}{" "}
          <a href={`tel:+91${site.phone}`} className="font-semibold text-brand underline underline-offset-4">
            {site.phone}
          </a>{" "}
          — {site.candidateName}, {site.address}
        </p>
      </div>
      <StickyCTA />
    </div>
  );
}
