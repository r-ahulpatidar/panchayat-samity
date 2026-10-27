"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categories, categoryIds, type CategoryId } from "@/content/hi/categories";
import { form } from "@/content/hi/form";
import { OTHER_VILLAGE, site } from "@/content/hi/site";
import { complaintSchema, type ComplaintData, type ComplaintInput } from "@/lib/validation/complaint";
import { buildFallbackMessage } from "@/lib/utils/fallback-message";
import { waLink } from "@/lib/utils/whatsapp-link";
import { buttonClass } from "@/components/ui/ButtonLink";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Field, FieldError, describedBy, inputClass } from "./Field";
import { PhotoPicker } from "./PhotoPicker";
import { Turnstile, turnstileEnabled } from "./Turnstile";

const f = form.fields;
const se = form.serverErrors;

const SERVER_MESSAGES: Record<string, string> = {
  invalid: se.invalid,
  "too-fast": se.tooFast,
  captcha: se.captcha,
  "in-progress": se.inProgress,
  "rate-limited": se.rateLimited,
  server: se.generic,
};

type ServerError = { message: string; showFallback: boolean };

function newRequestKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // पुराने ब्राउज़र के लिए v4 जैसा UUID
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16),
  );
}

export function ComplaintForm() {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [serverError, setServerError] = useState<ServerError | null>(null);
  const [geo, setGeo] = useState<"idle" | "locating" | "failed">("idle");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const requestKey = useRef<string>("");
  const startedAt = useRef<number>(0);
  const honeypot = useRef<HTMLInputElement>(null);
  const errorBox = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ComplaintInput, unknown, ComplaintData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      name: "",
      mobile: "",
      village: "",
      villageOther: "",
      description: "",
      location: "",
      mapLink: "",
    },
  });

  useEffect(() => {
    requestKey.current = newRequestKey();
    startedAt.current = Date.now();
    // ?shreni=pani — श्रेणी टाइल से आए हों तो पहले से चुनी हुई
    const fromUrl = new URLSearchParams(window.location.search).get("shreni");
    if (fromUrl && (categoryIds as readonly string[]).includes(fromUrl)) {
      setValue("category", fromUrl as CategoryId);
    }
  }, [setValue]);

  const onToken = useCallback((token: string | null) => setCaptchaToken(token), []);

  const mapLink = useWatch({ control, name: "mapLink" });
  const selectedCategory = useWatch({ control, name: "category" });
  const selectedVillage = useWatch({ control, name: "village" });

  function addLocation() {
    if (!("geolocation" in navigator)) return setGeo("failed");
    setGeo("locating");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setValue("mapLink", `https://maps.google.com/?q=${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`);
        setGeo("idle");
      },
      () => setGeo("failed"),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  function showError(error: ServerError) {
    setServerError(error);
    requestAnimationFrame(() => errorBox.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  async function onSubmit(data: ComplaintData) {
    setServerError(null);

    const body = new FormData();
    body.set("name", data.name);
    body.set("mobile", data.mobile);
    // गांव कच्चे रूप में (सूची का मान + "अन्य" का नाम) — सर्वर वही स्कीमा फिर चलाता है
    body.set("village", getValues("village"));
    body.set("villageOther", getValues("villageOther") ?? "");
    body.set("category", data.category);
    body.set("description", data.description);
    body.set("location", data.location);
    body.set("mapLink", data.mapLink);
    body.set("consent", "true");
    body.set("requestKey", requestKey.current);
    body.set("startedAt", String(startedAt.current));
    body.set("website", honeypot.current?.value ?? "");
    if (captchaToken) body.set("cf-turnstile-response", captchaToken);
    if (photo) body.set("photo", photo, "photo.jpg");

    let res: Response;
    let json: { ok: boolean; id?: string; code?: string; fieldErrors?: Record<string, string> };
    try {
      res = await fetch("/api/complaints", { method: "POST", body });
      json = await res.json();
    } catch {
      // नेटवर्क विफल — वही requestKey रखते हैं ताकि दोबारा भेजने पर डुप्लीकेट न बने
      return showError({ message: se.network, showFallback: true });
    }

    if (json.ok && json.id) {
      router.push(`/safal?id=${encodeURIComponent(json.id)}`);
      return;
    }

    // Turnstile टोकन एक बार ही चलता है — नया विजेट
    if (turnstileEnabled) {
      setCaptchaToken(null);
      setCaptchaKey((k) => k + 1);
    }

    if (json.fieldErrors) {
      for (const [name, message] of Object.entries(json.fieldErrors)) {
        if (name in getValues()) setError(name as keyof ComplaintInput, { message });
      }
    }
    if (json.code === "server") requestKey.current = newRequestKey();
    showError({
      message: SERVER_MESSAGES[json.code ?? "server"] ?? se.generic,
      showFallback: json.code === "server" || json.code === "rate-limited",
    });
  }

  const busy = isSubmitting || photoBusy || (turnstileEnabled && !captchaToken);

  return (
    <form onSubmit={(e) => handleSubmit(onSubmit)(e)} noValidate className="space-y-6">
      {/* स्पैम बॉट के लिए छुपा हुआ फील्ड — असली उपयोगकर्ता इसे नहीं देखते */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input ref={honeypot} id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Field id="name" label={f.name.label} required error={errors.name?.message}>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder={f.name.placeholder}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy("name", { error: Boolean(errors.name) })}
          className={inputClass(Boolean(errors.name))}
          {...register("name")}
        />
      </Field>

      <Field id="mobile" label={f.mobile.label} required hint={f.mobile.hint} error={errors.mobile?.message}>
        <input
          id="mobile"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={14}
          placeholder={f.mobile.placeholder}
          aria-invalid={Boolean(errors.mobile)}
          aria-describedby={describedBy("mobile", { hint: true, error: Boolean(errors.mobile) })}
          className={inputClass(Boolean(errors.mobile))}
          {...register("mobile")}
        />
      </Field>

      <Field id="village" label={f.village.label} required error={errors.village?.message}>
        <select
          id="village"
          aria-invalid={Boolean(errors.village)}
          aria-describedby={describedBy("village", { error: Boolean(errors.village) })}
          className={inputClass(Boolean(errors.village))}
          {...register("village")}
        >
          <option value="">{f.village.placeholder}</option>
          {site.villages.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
          <option value={OTHER_VILLAGE}>{f.village.other}</option>
        </select>
      </Field>

      {selectedVillage === OTHER_VILLAGE ? (
        <Field id="villageOther" label={f.villageOther.label} required error={errors.villageOther?.message}>
          <input
            id="villageOther"
            type="text"
            placeholder={f.villageOther.placeholder}
            aria-invalid={Boolean(errors.villageOther)}
            aria-describedby={describedBy("villageOther", { error: Boolean(errors.villageOther) })}
            className={inputClass(Boolean(errors.villageOther))}
            {...register("villageOther")}
          />
        </Field>
      ) : null}

      <fieldset
        className="space-y-2"
        aria-invalid={Boolean(errors.category)}
        aria-describedby={errors.category ? "category-error" : undefined}
      >
        <legend className="mb-1.5 font-semibold">
          {f.category.label} <span className="text-danger" aria-hidden="true">{form.required}</span>
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {categories.map((c) => {
            const checked = selectedCategory === c.id;
            return (
              <label
                key={c.id}
                className={`flex min-h-16 cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2 font-semibold leading-snug has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand ${
                  checked ? "border-brand bg-brand-soft text-brand-dark" : "border-line bg-white"
                }`}
              >
                <input type="radio" value={c.id} className="sr-only" {...register("category")} />
                <span aria-hidden="true" className="text-2xl">
                  {c.icon}
                </span>
                {c.label}
              </label>
            );
          })}
        </div>
        {errors.category?.message ? <FieldError id="category-error" message={errors.category.message} /> : null}
      </fieldset>

      <Field
        id="description"
        label={f.description.label}
        required
        hint={f.description.hint}
        error={errors.description?.message}
      >
        <textarea
          id="description"
          rows={5}
          placeholder={f.description.placeholder}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={describedBy("description", { hint: true, error: Boolean(errors.description) })}
          className={inputClass(Boolean(errors.description))}
          {...register("description")}
        />
      </Field>

      <div className="space-y-3">
        <Field id="location" label={f.location.label} hint={f.location.hint} error={errors.location?.message}>
          <input
            id="location"
            type="text"
            placeholder={f.location.placeholder}
            aria-invalid={Boolean(errors.location)}
            aria-describedby={describedBy("location", { hint: true, error: Boolean(errors.location) })}
            className={inputClass(Boolean(errors.location))}
            {...register("location")}
          />
        </Field>
        {mapLink ? (
          <p className="flex items-center gap-3 font-semibold text-green">
            {form.geo.added}
            <button type="button" className="text-danger underline underline-offset-4" onClick={() => setValue("mapLink", "")}>
              {form.geo.remove}
            </button>
          </p>
        ) : (
          <button type="button" onClick={addLocation} disabled={geo === "locating"} className={buttonClass("outline", "w-full")}>
            {geo === "locating" ? form.geo.locating : form.geo.button}
          </button>
        )}
        {geo === "failed" ? <p className="text-base font-semibold text-danger">{form.geo.failed}</p> : null}
      </div>

      <PhotoPicker onChange={setPhoto} onBusyChange={setPhotoBusy} />

      <div className="space-y-1.5">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-line bg-white p-4">
          <input
            type="checkbox"
            className="mt-1 size-6 shrink-0 accent-brand"
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "consent-error" : undefined}
            {...register("consent")}
          />
          <span>
            {f.consent.label}{" "}
            <Link href="/gopniyata-niti" target="_blank" className="font-semibold text-brand underline underline-offset-4">
              {f.consent.privacyLink}
            </Link>
          </span>
        </label>
        {errors.consent?.message ? <FieldError id="consent-error" message={errors.consent.message} /> : null}
      </div>

      <Turnstile key={captchaKey} onToken={onToken} />

      {serverError ? (
        <div ref={errorBox} role="alert" className="space-y-3 rounded-xl border-2 border-danger bg-danger-soft p-4">
          <p className="font-semibold text-danger">{serverError.message}</p>
          {serverError.showFallback ? (
            <>
              <p>{se.fallbackTitle}</p>
              <a
                href={waLink(site.whatsapp, buildFallbackMessage(getValues() as Partial<ComplaintData>))}
                className={buttonClass("whatsapp", "w-full")}
              >
                <WhatsAppIcon />
                {se.fallbackButton}
              </a>
            </>
          ) : null}
        </div>
      ) : null}

      <button type="submit" disabled={busy} className={buttonClass("primary", "w-full text-xl disabled:opacity-60")}>
        {isSubmitting ? (
          <>
            <span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {form.submitting}
          </>
        ) : (
          form.submit
        )}
      </button>
    </form>
  );
}
