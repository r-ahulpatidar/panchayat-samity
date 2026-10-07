import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/config/env";

/**
 * Upstash Redis — रेट लिमिट और डुप्लीकेट सबमिशन रोकना।
 * सर्वरलेस पर इन-मेमोरी लिमिट काम नहीं करती, इसलिए Redis सेट न हो तो ये जांच छोड़ दी जाती हैं।
 */
const redis = env.redis ? new Redis({ url: env.redis.url, token: env.redis.token }) : null;

const perIp = redis
  ? new Ratelimit({ redis, prefix: "rl:ip", limiter: Ratelimit.slidingWindow(5, "1 h") })
  : null;
const perMobile = redis
  ? new Ratelimit({ redis, prefix: "rl:mobile", limiter: Ratelimit.slidingWindow(3, "24 h") })
  : null;

export async function checkIpLimit(ip: string): Promise<boolean> {
  if (!perIp) return true;
  return (await perIp.limit(ip)).success;
}

export async function checkMobileLimit(mobile: string): Promise<boolean> {
  if (!perMobile) return true;
  return (await perMobile.limit(mobile)).success;
}

const IDEM_TTL_SECONDS = 600;
const PENDING = "pending";

export type IdempotencyState = { state: "new" } | { state: "pending" } | { state: "done"; id: string };

/** एक ही फॉर्म दो बार भेजा जाए (डबल-टैप / खराब नेटवर्क पर रीट्राई) तो दूसरी पंक्ति न बने। */
export async function claimIdempotencyKey(key: string): Promise<IdempotencyState> {
  if (!redis) return { state: "new" };
  const claimed = await redis.set(`idem:${key}`, PENDING, { nx: true, ex: IDEM_TTL_SECONDS });
  if (claimed === "OK") return { state: "new" };
  const existing = await redis.get<string>(`idem:${key}`);
  return existing && existing !== PENDING ? { state: "done", id: existing } : { state: "pending" };
}

export async function completeIdempotencyKey(key: string, id: string) {
  if (redis) await redis.set(`idem:${key}`, id, { ex: IDEM_TTL_SECONDS });
}

export async function releaseIdempotencyKey(key: string) {
  if (redis) await redis.del(`idem:${key}`);
}
