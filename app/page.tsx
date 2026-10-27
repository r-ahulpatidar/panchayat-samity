import Image from "next/image";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { CategoryGrid } from "@/components/ui/CategoryGrid";
import { ContactButtons } from "@/components/ui/ContactButtons";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { common } from "@/content/hi/common";
import { contact } from "@/content/hi/contact";
import { home } from "@/content/hi/home";
import { areaLine, site } from "@/content/hi/site";

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.candidateName,
    jobTitle: site.role,
    telephone: `+91${site.phone}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address,
      addressLocality: site.tehsil,
      addressRegion: site.state,
      addressCountry: "IN",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* परिचय */}
      <section className="grid items-center gap-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-line md:grid-cols-[auto_1fr] md:p-8">
        <Image
          src={site.photo}
          alt={site.candidateName}
          width={176}
          height={176}
          priority
          unoptimized={site.photo.endsWith(".svg")}
          className="mx-auto size-36 rounded-full object-cover ring-4 ring-brand-soft md:size-44"
        />
        <div className="space-y-3 text-center md:text-left">
          <p className="font-semibold text-brand">{home.heroTagline}</p>
          <h1 className="text-3xl font-bold leading-snug md:text-4xl">{site.candidateName}</h1>
          <p className="text-muted">
            {site.role} · {areaLine}
          </p>
          <p className="rounded-xl bg-brand-soft px-4 py-2 text-lg font-bold leading-snug text-brand-dark">
            {home.heroSlogan}
          </p>
          <p>{home.heroIntro}</p>
          <ButtonLink href="/samasya-batayen" className="w-full text-xl md:w-auto md:px-10">
            {common.cta}
          </ButtonLink>
        </div>
      </section>

      {/* उद्देश्य */}
      <section className="mt-10 space-y-3">
        <h2 className="text-2xl font-bold">{home.purposeTitle}</h2>
        <p>{home.purposeBody}</p>
      </section>

      {/* गांव */}
      <section className="mt-10 space-y-4">
        <h2 className="text-2xl font-bold">{home.villagesTitle}</h2>
        <ul className="flex flex-wrap gap-2">
          {site.villages.map((v) => (
            <li key={v} className="rounded-full bg-white px-4 py-2 font-semibold ring-1 ring-line">
              {v}
            </li>
          ))}
        </ul>
      </section>

      {/* कैसे काम करता है */}
      <section className="mt-10 space-y-4">
        <h2 className="text-2xl font-bold">{home.howTitle}</h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {home.steps.map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-line">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
                {(i + 1).toLocaleString("hi-IN")}
              </span>
              <div>
                <h3 className="font-bold">{step.title}</h3>
                <p className="text-base text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* स्थिति पेज */}
      <section className="mt-10 space-y-3 rounded-3xl bg-white p-5 ring-1 ring-line md:p-8">
        <h2 className="text-2xl font-bold">{home.statusTitle}</h2>
        <p>{home.statusBody}</p>
        <ButtonLink href="/samasya-sthiti" variant="outline" className="w-full md:w-auto">
          {home.statusCta}
        </ButtonLink>
      </section>

      {/* श्रेणियां */}
      <section className="mt-10 space-y-4">
        <div>
          <h2 className="text-2xl font-bold">{home.categoriesTitle}</h2>
          <p className="text-muted">{home.categoriesHint}</p>
        </div>
        <CategoryGrid />
      </section>

      {/* संपर्क */}
      <section className="mt-10 space-y-4 rounded-3xl bg-green-soft p-5 md:p-8">
        <h2 className="text-2xl font-bold">{home.contactTitle}</h2>
        <p>{home.contactBody}</p>
        <ContactButtons greeting={contact.whatsappGreeting} />
      </section>

      <StickyCTA />
    </>
  );
}
