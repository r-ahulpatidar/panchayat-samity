"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { common } from "@/content/hi/common";

/**
 * मोबाइल मेनू — <details> पर आधारित (JS लोड होने से पहले भी खुलता है),
 * साथ में: बाहर टैप करने, Escape दबाने या कोई लिंक चुनने पर अपने आप बंद।
 */
export function MobileMenu() {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = ref.current;
    if (!details) return;

    const close = () => {
      details.open = false;
    };
    const onPointerDown = (e: PointerEvent) => {
      if (details.open && !details.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && details.open) {
        close();
        details.querySelector("summary")?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details ref={ref} className="group relative md:hidden">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-lg border border-line px-4 font-semibold [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="w-5 text-center text-xl group-open:hidden">
          ☰
        </span>
        <span aria-hidden="true" className="hidden w-5 text-center text-xl group-open:inline">
          ✕
        </span>
        {common.menu}
      </summary>
      <nav aria-label="मुख्य" className="absolute right-0 mt-2 w-64 rounded-xl border border-line bg-white p-2 shadow-lg">
        <ul>
          {common.nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => {
                  if (ref.current) ref.current.open = false;
                }}
                className="block rounded-lg px-4 py-3 font-semibold hover:bg-brand-soft"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
