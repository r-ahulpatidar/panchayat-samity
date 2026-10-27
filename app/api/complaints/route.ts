import { revalidateTag } from "next/cache";
import { after } from "next/server";
import { ISSUES_CACHE_TAG } from "@/lib/complaints/public-issues";
import { notifyAndRecord, submitComplaint, type SubmitErrorCode } from "@/lib/complaints/submit";

export const maxDuration = 30;

const HTTP_STATUS: Record<SubmitErrorCode, number> = {
  invalid: 400,
  "too-fast": 400,
  captcha: 403,
  "in-progress": 409,
  "rate-limited": 429,
  server: 500,
};

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ ok: false, code: "invalid" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const result = await submitComplaint(formData, ip);

  if (!result.ok) {
    return Response.json(result, { status: HTTP_STATUS[result.code] });
  }

  // शिकायत सेव हो चुकी है — WhatsApp जवाब भेजने के बाद, ताकि उसकी देरी/विफलता उपयोगकर्ता को न रोके
  const saved = result.saved;
  if (saved) {
    // स्थिति पेज अगली विज़िट पर ताज़ा डेटा पढ़े, ताकि नई शिकायत तुरंत दिखे
    revalidateTag(ISSUES_CACHE_TAG, { expire: 0 });
    after(() => notifyAndRecord(saved));
  }

  return Response.json({ ok: true, id: result.id });
}
