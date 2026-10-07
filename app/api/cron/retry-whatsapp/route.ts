import { env } from "@/config/env";
import { getComplaintRepository } from "@/lib/complaints/repository";
import { notifyAndRecord } from "@/lib/complaints/submit";

export const maxDuration = 60;

/**
 * Vercel Cron (vercel.json) रोज़ एक बार चलाता है — शीट में "विफल" WhatsApp वाली
 * शिकायतें दोबारा भेजता है। Vercel अपने आप `Authorization: Bearer $CRON_SECRET` भेजता है।
 */
export async function GET(request: Request) {
  if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const repo = getComplaintRepository();
  if (!repo) return Response.json({ ok: false, error: "repository not configured" }, { status: 500 });

  const failed = await repo.listWhatsAppFailed();
  for (const complaint of failed) {
    await notifyAndRecord(complaint);
  }

  return Response.json({ ok: true, retried: failed.map((c) => c.id) });
}
