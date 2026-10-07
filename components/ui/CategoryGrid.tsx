import Link from "next/link";
import { categories } from "@/content/hi/categories";

/** हर टाइल फॉर्म को उसी श्रेणी के साथ खोलती है: /samasya-batayen?shreni=pani */
export function CategoryGrid({ withDescription = false }: { withDescription?: boolean }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {categories.map((c) => (
        <li key={c.id}>
          <Link
            href={`/samasya-batayen?shreni=${c.id}`}
            className="flex h-full min-h-28 flex-col items-center justify-center gap-1 rounded-2xl border border-line bg-white p-3 text-center hover:border-brand hover:bg-brand-soft"
          >
            <span aria-hidden="true" className="text-3xl">
              {c.icon}
            </span>
            <span className="font-semibold leading-snug">{c.label}</span>
            {withDescription ? <span className="text-sm leading-snug text-muted">{c.description}</span> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
