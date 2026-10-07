import Link from "next/link";
import { common } from "@/content/hi/common";
import { site } from "@/content/hi/site";
import { WhatsAppIcon } from "@/components/ui/icons";
import { waLink } from "@/lib/utils/whatsapp-link";

/** मोबाइल पर हमेशा दिखने वाली नीचे की पट्टी (फॉर्म पेज को छोड़कर हर पेज पर रखी जाती है)। */
export function StickyCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-3 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-5xl gap-3">
        <Link
          href="/samasya-batayen"
          className="flex min-h-14 flex-1 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white"
        >
          {common.cta}
        </Link>
        <a
          href={waLink(site.whatsapp)}
          className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-green text-white"
          aria-label={common.whatsappUs}
        >
          <WhatsAppIcon className="size-7" />
        </a>
      </div>
    </div>
  );
}
