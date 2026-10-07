"use client";

import { useEffect, useRef, useState } from "react";
import { form } from "@/content/hi/form";
import { compressImage } from "@/lib/utils/image-compress";

const t = form.fields.photo;

type Props = {
  onChange: (file: File | null) => void;
  onBusyChange: (busy: boolean) => void;
};

/**
 * फोटो चुनें → ब्राउज़र में छोटी करें → पूर्वावलोकन।
 * `capture` नहीं लगाया ताकि फोन पर कैमरा और गैलरी दोनों का विकल्प मिले।
 */
export function PhotoPicker({ onChange, onBusyChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const previewRef = useRef<string | null>(null);

  function showPreview(file: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = file ? URL.createObjectURL(file) : null;
    setPreview(previewRef.current);
    onChange(file);
  }

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  async function handleFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t.invalid);
      return;
    }
    setBusy(true);
    onBusyChange(true);
    try {
      showPreview(await compressImage(file));
    } catch {
      setError(t.failed);
      showPreview(null);
    } finally {
      setBusy(false);
      onBusyChange(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <p className="font-semibold">
        {t.label} <span className="text-base font-normal text-muted">{form.optional}</span>
      </p>
      <p id="photo-hint" className="text-base text-muted">
        {t.hint}
      </p>

      <input
        ref={inputRef}
        id="photo"
        type="file"
        accept="image/*"
        className="sr-only"
        aria-describedby="photo-hint"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {preview ? (
        <div className="flex items-center gap-4 rounded-xl border-2 border-line bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- लोकल blob: पूर्वावलोकन */}
          <img src={preview} alt="" className="size-24 rounded-lg object-cover" />
          <div className="flex flex-col gap-2">
            <label htmlFor="photo" className="cursor-pointer font-semibold text-brand underline underline-offset-4">
              {t.change}
            </label>
            <button type="button" onClick={() => showPreview(null)} className="text-left font-semibold text-danger underline underline-offset-4">
              {t.remove}
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor="photo"
          className="flex min-h-14 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-brand bg-brand-soft px-4 text-lg font-semibold text-brand"
        >
          {busy ? t.preparing : t.add}
        </label>
      )}

      {error ? (
        <p role="alert" className="text-base font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
