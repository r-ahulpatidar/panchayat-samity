import type { Metadata } from "next";
import Image from "next/image";
import { ContactButtons } from "@/components/ui/ContactButtons";
import { PageHeading } from "@/components/ui/PageHeading";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { about } from "@/content/hi/about";
import { contact } from "@/content/hi/contact";
import { areaLine, site } from "@/content/hi/site";

export const metadata: Metadata = {
  title: about.metaTitle,
  description: about.metaDescription,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading title={about.title} />

      <div className="mb-8 flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-line">
        <Image
          src={site.photo}
          alt={site.candidateName}
          width={96}
          height={96}
          unoptimized={site.photo.endsWith(".svg")}
          className="size-24 shrink-0 rounded-full object-cover"
        />
        <div>
          <p className="text-xl font-bold">{site.candidateName}</p>
          <p className="text-muted">{site.role}</p>
          <p className="text-base text-muted">{areaLine}</p>
        </div>
      </div>

      <div className="space-y-8">
        {about.sections.map((s) => (
          <section key={s.title} className="space-y-2">
            <h2 className="text-2xl font-bold">{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">{about.prioritiesTitle}</h2>
          <ul className="space-y-2">
            {about.priorities.map((p) => (
              <li key={p} className="flex gap-3 rounded-xl bg-white p-3 ring-1 ring-line">
                <span aria-hidden="true" className="font-bold text-green">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">{contact.title}</h2>
          <ContactButtons greeting={contact.whatsappGreeting} />
        </section>
      </div>

      <StickyCTA />
    </div>
  );
}
