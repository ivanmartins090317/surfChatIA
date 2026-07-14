import { beforeEach, describe, expect, it } from "vitest";
import {
  checkRateLimitInMemory,
  resetRateLimitMemoryStore,
} from "@/lib/security/rate-limit-memory";
import {
  AI_RATE_LIMIT,
  AUTH_RATE_LIMIT,
  rateLimitAiAction,
  rateLimitAuthAction,
} from "@/services/rate-limit-service";

describe("checkRateLimitInMemory", () => {
  beforeEach(() => {
    resetRateLimitMemoryStore();
  });

  it("bloqueia após atingir o limite", () => {
    const key = `memory-${Date.now()}`;

    for (let attempt = 0; attempt < AUTH_RATE_LIMIT.limit; attempt += 1) {
      expect(
        checkRateLimitInMemory({
          key,
          limit: AUTH_RATE_LIMIT.limit,
          windowMs: AUTH_RATE_LIMIT.windowMs,
        }).allowed,
      ).toBe(true);
    }

    const blocked = checkRateLimitInMemory({
      key,
      limit: AUTH_RATE_LIMIT.limit,
      windowMs: AUTH_RATE_LIMIT.windowMs,
    });

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });
});

describe("rateLimitAuthAction", () => {
  it("permite tentativas dentro do limite", async () => {
    const id = `auth-test-${Date.now()}@example.com`;
    await expect(rateLimitAuthAction(id)).resolves.toEqual({ allowed: true });
  });
});

describe("rateLimitAiAction", () => {
  it("permite primeira análise do dia", async () => {
    const userId = `user-ai-${Date.now()}`;
    await expect(rateLimitAiAction(userId)).resolves.toEqual({ allowed: true });
  });

  it("usa limite diário de IA configurado", () => {
    expect(AI_RATE_LIMIT.limit).toBe(20);
    expect(AI_RATE_LIMIT.windowMs).toBe(24 * 60 * 60 * 1000);
  });
});
