import "server-only";
import { env } from "@/config/env";
import { createSheetsRepository } from "@/lib/services/google-sheets";
import { createDevRepository } from "./dev-repository";
import type { ComplaintRepository } from "./types";

let repo: ComplaintRepository | null | undefined;

/** प्रोडक्शन में शीट सेट न हो तो null — रूट उपयोगकर्ता को wa.me फॉलबैक दिखाता है। */
export function getComplaintRepository(): ComplaintRepository | null {
  if (repo !== undefined) return repo;
  if (env.sheets) {
    repo = createSheetsRepository({ ...env.sheets, idPrefix: env.COMPLAINT_ID_PREFIX });
  } else if (!env.isProd) {
    repo = createDevRepository(env.COMPLAINT_ID_PREFIX);
  } else {
    console.error("[complaints] GOOGLE_* env vars missing in production");
    repo = null;
  }
  return repo;
}
