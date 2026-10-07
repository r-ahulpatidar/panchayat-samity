import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ContactButtons } from "@/components/ui/ContactButtons";
import { PageHeading } from "@/components/ui/PageHeading";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { common } from "@/content/hi/common";
import { contact } from "@/content/hi/contact";
import { site } from "@/content/hi/site";

export const metadata: Metadata = {
  title: contact.metaTitle,
  description: contact.metaDescription,
};

export default function ContactPage() {
  const rows = [
    { label: contact.mobile, value: site.phone, href: `tel:+91${site.phone}` },
    { label: contact.whatsapp, value: `+${site.whatsapp}` },
    { label: contact.address, value: site.address },
    { label: contact.hours, value: site.officeHours },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading title={contact.title} intro={contact.intro} />

      <dl className="mb-6 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
        {rows.map((r) => (
          <div key={r.label} className="p-4">
            <dt className="text-base text-muted">{r.label}</dt>
            <dd className="text-xl font-semibold">
              {r.href ? (
                <a href={r.href} className="text-brand underline underline-offset-4">
                  {r.value}
                </a>
              ) : (
                r.value
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="space-y-3">
        <ContactButtons greeting={contact.whatsappGreeting} />
        <ButtonLink href="/samasya-batayen" className="w-full">
          {common.cta}
        </ButtonLink>
      </div>

      <StickyCTA />
    </div>
  );
}
