import { afterEach, describe, expect, it, vi } from "vitest";

describe("getClientIp", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("x-forwarded-forヘッダーの先頭IPを返す", async () => {
    const { getClientIp } = await import("./ai-rate-limiter");
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
    });

    expect(getClientIp(req)).toBe("203.0.113.1");
  });

  it("ヘッダーが無い場合はunknownを返す", async () => {
    const { getClientIp } = await import("./ai-rate-limiter");
    const req = new Request("http://localhost");

    expect(getClientIp(req)).toBe("unknown");
  });
});

describe("checkAiRateLimit", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("UPSTASH_REDIS_REST_URL/TOKEN未設定の環境では常に許可する", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", undefined);
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", undefined);

    const { checkAiRateLimit } = await import("./ai-rate-limiter");
    const result = await checkAiRateLimit("test-ip");

    expect(result.success).toBe(true);
  });
});
