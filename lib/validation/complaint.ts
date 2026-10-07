import { z } from "zod";
import { categoryIds } from "@/content/hi/categories";
import { form } from "@/content/hi/form";
import { OTHER_VILLAGE, site } from "@/content/hi/site";

const e = form.errors;

/** "+91 98765-43210" / "098765 43210" → "9876543210" */
export function normalizeMobile(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

const villageOptions: readonly string[] = [...site.villages, OTHER_VILLAGE];

/**
 * क्लाइंट और सर्वर दोनों पर एक ही स्कीमा चलता है।
 * गांव सूची से चुना जाता है; "अन्य" चुनने पर villageOther में नाम लिखा जाता है।
 * आउटपुट में village = असली गांव का नाम (villageOther हट जाता है)।
 */
export const complaintSchema = z
  .object({
    name: z.string().trim().min(2, e.nameShort).max(60, e.nameLong),
    mobile: z
      .string()
      .transform(normalizeMobile)
      .pipe(z.string().regex(/^[6-9]\d{9}$/, e.mobile)),
    village: z.string({ error: e.village }).refine((v) => villageOptions.includes(v), e.village),
    villageOther: z.string().trim().max(60, e.villageLong).default(""),
    category: z.enum(categoryIds, { error: e.category }),
    description: z.string().trim().min(10, e.descriptionShort).max(1000, e.descriptionLong),
    location: z.string().trim().max(200, e.locationLong).default(""),
    mapLink: z
      .string()
      .trim()
      .max(120)
      .refine((v) => v === "" || v.startsWith("https://maps.google.com/"), "invalid map link")
      .default(""),
    consent: z.literal(true, { error: e.consent }),
  })
  .superRefine((d, ctx) => {
    if (d.village === OTHER_VILLAGE && d.villageOther.length < 2) {
      ctx.addIssue({ code: "custom", path: ["villageOther"], message: e.villageOther });
    }
  })
  .transform(({ villageOther, ...rest }) => ({
    ...rest,
    village: rest.village === OTHER_VILLAGE ? `${villageOther} (${OTHER_VILLAGE})` : rest.village,
  }));

export type ComplaintInput = z.input<typeof complaintSchema>;
export type ComplaintData = z.output<typeof complaintSchema>;
