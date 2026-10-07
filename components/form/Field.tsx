import type { ReactNode } from "react";
import { form } from "@/content/hi/form";

type Props = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
};

/** लेबल ऊपर, संकेत, और नीचे त्रुटि — aria-describedby के लिए आईडी: `${id}-hint`, `${id}-error` */
export function Field({ id, label, required, hint, error, children }: Props) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-semibold">
        {label}{" "}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {form.required}
          </span>
        ) : (
          <span className="text-base font-normal text-muted">{form.optional}</span>
        )}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="text-base text-muted">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? <FieldError id={`${id}-error`} message={error} /> : null}
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role="alert" className="text-base font-semibold text-danger">
      {message}
    </p>
  );
}

export const inputClass = (hasError: boolean) =>
  `block w-full min-h-14 rounded-xl border-2 bg-white px-4 py-3 text-lg placeholder:text-stone-400 ${
    hasError ? "border-danger bg-danger-soft" : "border-line focus:border-brand"
  }`;

export const describedBy = (id: string, opts: { hint?: boolean; error?: boolean }) =>
  [opts.hint && `${id}-hint`, opts.error && `${id}-error`].filter(Boolean).join(" ") || undefined;
