import Link from "next/link";
import { common } from "@/content/hi/common";
import { areaLine, site } from "@/content/hi/site";

export function Footer() {
  return (
    // नीचे की sticky पट्टी के लिए अतिरिक्त जगह (pb-28)
    <footer className="mt-12 border-t border-line bg-white pb-28 md:pb-8">
      <div className="mx-auto max-w-5xl space-y-3 px-4 pt-8 text-base text-muted">
        <p className="font-semibold text-ink">
          {site.candidateName} — {site.role}
        </p>
        <p>{areaLine}</p>
        <p>{common.footer.purpose}</p>
        <p>
          <Link href="/gopniyata-niti" className="font-semibold text-brand underline underline-offset-4">
            {common.footer.privacy}
          </Link>
        </p>
      </div>
    </footer>
  );
}
