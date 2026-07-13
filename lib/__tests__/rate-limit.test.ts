import { describe, expect, it } from "vitest";
import {
  rateLimitAiAction,
  rateLimitAuthAction,
} from "@/lib/security/rate-limit";

describe("rateLimitAuthAction", () => {
  it("permite tentativas dentro do limite", () => {
    const id = `auth-test-${Date.now()}@example.com`;
    expect(rateLimitAuthAction(id).allowed).toBe(true);
  });
});

describe("rateLimitAiAction", () => {
  it("permite primeira análise do dia", () => {
    const userId = `user-ai-${Date.now()}`;
    expect(rateLimitAiAction(userId).allowed).toBe(true);
  });
});
