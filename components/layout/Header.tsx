import Link from "next/link";
import { common } from "@/content/hi/common";
import { site } from "@/content/hi/site";
import { MobileMenu } from "./MobileMenu";

/** डेस्कटॉप पर पूरा मेनू, मोबाइल पर MobileMenu (बाहर टैप करने पर बंद होता है) */
export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2">
        <Link href="/" className="flex min-h-12 flex-col justify-center leading-tight">
          <span className="text-lg font-bold text-brand">{site.candidateName}</span>
          <span className="text-sm text-muted">{site.panchayatName}</span>
        </Link>

        <nav aria-label="मुख्य" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {common.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="rounded-lg px-3 py-2 font-semibold hover:bg-brand-soft">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <MobileMenu />
      </div>
    </header>
  );
}
