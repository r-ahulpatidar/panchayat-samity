"use client";

import { useState, useSyncExternalStore } from "react";
import { ButtonLink, buttonClass } from "@/components/ui/ButtonLink";
import { WhatsAppIcon } from "@/components/ui/icons";
import { success as t } from "@/content/hi/form";
import { waLink } from "@/lib/utils/whatsapp-link";

const ID_RE = /^[A-Z]+-\d{4}-\d{4,}$/;
const noopSubscribe = () => () => {};

export function SuccessCard() {
  // URL ब्राउज़र में पढ़ा जाता है ताकि पेज स्टैटिक रहे; सर्वर पर null (= लोड हो रहा है)
  const search = useSyncExternalStore(noopSubscribe, () => window.location.search, () => null);
  const loaded = search !== null;
  const raw = loaded ? new URLSearchParams(search).get("id") : null;
  const id = raw && ID_RE.test(raw) ? raw : null;
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="space-y-6 rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-line">
      <div aria-hidden="true" className="mx-auto flex size-20 items-center justify-center rounded-full bg-green-soft text-5xl text-green">
        ✓
      </div>
      <h1 className="text-3xl font-bold leading-snug">{t.title}</h1>
      <p>{t.body}</p>

      {loaded && id ? (
        <div className="space-y-3 rounded-2xl bg-brand-soft p-5">
          <p className="font-semibold text-muted">{t.idLabel}</p>
          <p className="select-all text-3xl font-bold tracking-wide text-brand-dark" aria-live="polite">
            {id}
          </p>
          <p className="text-base text-muted">{t.idHint}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={copy} className={buttonClass("outline")}>
              {copied ? t.copied : t.copy}
            </button>
            {/* बिना नंबर का wa.me → उपयोगकर्ता खुद को/किसी को भी भेज सकता है */}
            <a href={waLink("", `${t.shareText} ${id}`)} className={buttonClass("whatsapp")}>
              <WhatsAppIcon />
              {t.saveOnWhatsapp}
            </a>
          </div>
        </div>
      ) : loaded ? (
        <p className="text-muted">{t.missingId}</p>
      ) : (
        <div className="h-40 animate-pulse rounded-2xl bg-brand-soft" />
      )}

      <div className="grid gap-3">
        <ButtonLink href="/samasya-batayen" variant="primary">
          {t.another}
        </ButtonLink>
        <ButtonLink href="/" variant="outline">
          {t.home}
        </ButtonLink>
      </div>
    </section>
  );
}
