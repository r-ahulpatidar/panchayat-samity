import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/ui/PageHeading";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { categories } from "@/content/hi/categories";
import { priorities } from "@/content/hi/priorities";

export const metadata: Metadata = {
  title: priorities.metaTitle,
  description: priorities.metaDescription,
};

export default function PrioritiesPage() {
  return (
    <>
      <PageHeading title={priorities.title} intro={priorities.intro} />
      <ul className="grid gap-3 sm:grid-cols-2">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/samasya-batayen?shreni=${c.id}`}
              className="flex h-full items-center gap-4 rounded-2xl border border-line bg-white p-4 hover:border-brand hover:bg-brand-soft"
            >
              <span aria-hidden="true" className="text-4xl">
                {c.icon}
              </span>
              <span className="flex-1">
                <span className="block text-xl font-bold">{c.label}</span>
                <span className="block text-base text-muted">{c.description}</span>
                <span className="mt-1 block text-base font-semibold text-brand">{priorities.reportThis} →</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <StickyCTA />
    </>
  );
}
