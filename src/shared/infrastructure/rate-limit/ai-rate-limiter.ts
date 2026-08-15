import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// LLM APIコストの濫用防止のため、AI関連エンドポイント（/api/ai/chat, /api/search/nl）にIPベースの
// レート制限をかける。Upstash Redis（無料枠）のsliding windowアルゴリズムで1分あたりの回数を制限する。
function createRatelimit(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const redis = new Redis({ url, token });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "ratelimit:ai",
  });
}

const ratelimit = createRatelimit();

export interface RateLimitCheckResult {
  success: boolean;
  limit: number;
  remaining: number;
}

// UPSTASH_REDIS_REST_URL/TOKENが未設定の環境（ローカル開発等）では制限をかけずに常に許可する
export async function checkAiRateLimit(identifier: string): Promise<RateLimitCheckResult> {
  if (!ratelimit) {
    return { success: true, limit: Infinity, remaining: Infinity };
  }
  return ratelimit.limit(identifier);
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "unknown";
}
