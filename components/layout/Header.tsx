import Link from "next/link";
import { common } from "@/content/hi/common";
import { site } from "@/content/hi/site";

/** मोबाइल मेनू <details> से — बिना किसी JavaScript के। */
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

        <details className="group relative md:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-lg border border-line px-4 font-semibold [&::-webkit-details-marker]:hidden">
            <span aria-hidden="true" className="text-xl">☰</span>
            {common.menu}
          </summary>
          <nav aria-label="मुख्य" className="absolute right-0 mt-2 w-64 rounded-xl border border-line bg-white p-2 shadow-lg">
            <ul>
              {common.nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="block rounded-lg px-4 py-3 font-semibold hover:bg-brand-soft">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
