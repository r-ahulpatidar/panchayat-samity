"use client";

import Image from "next/image";
import { useRef } from "react";
import { issuesPage as t } from "@/content/hi/status";

/**
 * कार्ड पर फोटो का छोटा रूप — पूरी फोटो दिखती है (खड़ी फोटो कटती नहीं);
 * टैप करने पर बड़ी फोटो (native <dialog>, ✕ / Esc / बाहर टैप से बंद)
 */
export function IssuePhoto({ src, alt }: { src: string; alt: string }) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="group relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-stone-100"
        aria-label={t.openPhoto}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 768px) 460px, 100vw"
          className="object-contain"
        />
        <span className="absolute right-2 bottom-2 rounded-full bg-black/65 px-3 py-1 text-sm font-semibold text-white">
          🔍 {t.enlarge}
        </span>
      </button>

      <dialog
        ref={dialog}
        aria-label={alt}
        onClick={(e) => {
          // फोटो के बाहर (backdrop) टैप करने पर बंद
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto w-[min(96vw,900px)] max-w-none rounded-2xl bg-black p-0 backdrop:bg-black/80"
      >
        <div className="relative h-[80vh] w-full">
          <Image src={src} alt={alt} fill sizes="96vw" className="object-contain" />
        </div>
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          className="absolute top-2 right-2 flex size-12 items-center justify-center rounded-full bg-white text-xl font-bold text-ink"
          aria-label={t.closePhoto}
        >
          ✕
        </button>
      </dialog>
    </>
  );
}
