import { common } from "@/content/hi/common";
import { site } from "@/content/hi/site";
import { PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { buttonClass } from "@/components/ui/ButtonLink";
import { waLink } from "@/lib/utils/whatsapp-link";

export function ContactButtons({ greeting }: { greeting?: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <a href={`tel:+91${site.phone}`} className={buttonClass("outline")}>
        <PhoneIcon />
        {common.callUs}
      </a>
      <a href={waLink(site.whatsapp, greeting)} className={buttonClass("whatsapp")}>
        <WhatsAppIcon />
        {common.whatsappUs}
      </a>
    </div>
  );
}
