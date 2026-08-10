import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AI_USAGE_KIND,
  buildAiUsageLogPayload,
  estimateGpt4oMiniCostUsd,
  extractAiTokenUsage,
  GPT_4O_MINI_INPUT_USD_PER_1M,
  GPT_4O_MINI_OUTPUT_USD_PER_1M,
  logAiUsage,
} from "@/lib/ai/usage-log";

describe("extractAiTokenUsage", () => {
  it("extrai tokens de usage válido", () => {
    expect(
      extractAiTokenUsage({
        prompt_tokens: 1200,
        completion_tokens: 400,
        total_tokens: 1600,
      }),
    ).toEqual({
      promptTokens: 1200,
      completionTokens: 400,
      totalTokens: 1600,
    });
  });

  it("retorna nulls quando usage está ausente", () => {
    expect(extractAiTokenUsage(undefined)).toEqual({
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
    });
  });

  it("ignora valores negativos ou não numéricos", () => {
    expect(
      extractAiTokenUsage({
        prompt_tokens: -1,
        completion_tokens: Number.NaN,
        total_tokens: 10.9,
      }),
    ).toEqual({
      promptTokens: null,
      completionTokens: null,
      totalTokens: 10,
    });
  });
});

describe("estimateGpt4oMiniCostUsd", () => {
  it("calcula custo com preços oficiais por 1M tokens", () => {
    const promptTokens = 1_000_000;
    const completionTokens = 1_000_000;
    const cost = estimateGpt4oMiniCostUsd({
      promptTokens,
      completionTokens,
      totalTokens: 2_000_000,
    });

    expect(cost).toBe(
      GPT_4O_MINI_INPUT_USD_PER_1M + GPT_4O_MINI_OUTPUT_USD_PER_1M,
    );
  });

  it("retorna null se tokens incompletos", () => {
    expect(
      estimateGpt4oMiniCostUsd({
        promptTokens: 100,
        completionTokens: null,
        totalTokens: null,
      }),
    ).toBeNull();
  });

  it("estima custo típico de visão com frames", () => {
    const cost = estimateGpt4oMiniCostUsd({
      promptTokens: 12_000,
      completionTokens: 800,
      totalTokens: 12_800,
    });

    expect(cost).toBeCloseTo(0.00228, 5);
  });
});

describe("buildAiUsageLogPayload", () => {
  it("monta payload text sem imageCount", () => {
    const payload = buildAiUsageLogPayload({
      model: "gpt-4o-mini",
      kind: AI_USAGE_KIND.text,
      imageCount: 5,
      usage: {
        prompt_tokens: 500,
        completion_tokens: 200,
        total_tokens: 700,
      },
    });

    expect(payload.kind).toBe("text");
    expect(payload.imageCount).toBe(0);
    expect(payload.estimatedCostUsd).not.toBeNull();
  });

  it("mantém imageCount em vision", () => {
    const payload = buildAiUsageLogPayload({
      model: "gpt-4o-mini",
      kind: AI_USAGE_KIND.vision,
      imageCount: 6,
      usage: {
        prompt_tokens: 10_000,
        completion_tokens: 500,
        total_tokens: 10_500,
      },
    });

    expect(payload.imageCount).toBe(6);
  });
});

describe("logAiUsage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.SENTRY_DSN;
  });

  it("emite JSON estruturado sem campos de conteúdo", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    logAiUsage({
      model: "gpt-4o-mini",
      kind: AI_USAGE_KIND.vision,
      imageCount: 3,
      usage: {
        promptTokens: 9000,
        completionTokens: 400,
        totalTokens: 9400,
      },
      estimatedCostUsd: 0.00159,
    });

    expect(info).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(String(info.mock.calls[0]?.[0]));
    expect(logged).toMatchObject({
      event: "ai.usage",
      model: "gpt-4o-mini",
      kind: "vision",
      imageCount: 3,
      promptTokens: 9000,
      completionTokens: 400,
      totalTokens: 9400,
      estimatedCostUsd: 0.00159,
    });
    expect(logged).not.toHaveProperty("prompt");
    expect(logged).not.toHaveProperty("base64");
    expect(logged).not.toHaveProperty("userId");
  });
});
