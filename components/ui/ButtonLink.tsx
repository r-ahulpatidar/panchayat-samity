import Link from "next/link";
import type { ComponentProps } from "react";

const variants = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  whatsapp: "bg-green text-white hover:bg-green-dark",
  outline: "border-2 border-brand text-brand bg-white hover:bg-brand-soft",
} as const;

export const buttonClass = (variant: keyof typeof variants = "primary", extra = "") =>
  `inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-6 text-lg font-semibold transition-colors ${variants[variant]} ${extra}`;

type Props = ComponentProps<typeof Link> & { variant?: keyof typeof variants };

export function ButtonLink({ variant = "primary", className = "", ...props }: Props) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}
