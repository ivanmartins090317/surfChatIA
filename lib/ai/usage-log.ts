import * as Sentry from "@sentry/nextjs";

/** Preços oficiais gpt-4o-mini (USD / 1M tokens) — ref. OpenAI, ago/2026. */
export const GPT_4O_MINI_INPUT_USD_PER_1M = 0.15;
export const GPT_4O_MINI_OUTPUT_USD_PER_1M = 0.6;

export const AI_USAGE_KIND = {
  text: "text",
  vision: "vision",
} as const;

export type AiUsageKind = (typeof AI_USAGE_KIND)[keyof typeof AI_USAGE_KIND];

export interface AiTokenUsage {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
}

export interface AiUsageLogPayload {
  model: string;
  kind: AiUsageKind;
  imageCount: number;
  usage: AiTokenUsage;
  estimatedCostUsd: number | null;
}

export interface RawCompletionUsage {
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  total_tokens?: number | null;
}

export function extractAiTokenUsage(
  usage: RawCompletionUsage | null | undefined,
): AiTokenUsage {
  if (!usage) {
    return {
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
    };
  }

  return {
    promptTokens: toNonNegativeIntOrNull(usage.prompt_tokens),
    completionTokens: toNonNegativeIntOrNull(usage.completion_tokens),
    totalTokens: toNonNegativeIntOrNull(usage.total_tokens),
  };
}

export function estimateGpt4oMiniCostUsd(usage: AiTokenUsage): number | null {
  if (usage.promptTokens === null || usage.completionTokens === null) {
    return null;
  }

  const inputCost =
    (usage.promptTokens / 1_000_000) * GPT_4O_MINI_INPUT_USD_PER_1M;
  const outputCost =
    (usage.completionTokens / 1_000_000) * GPT_4O_MINI_OUTPUT_USD_PER_1M;

  return roundUsd(inputCost + outputCost);
}

export function buildAiUsageLogPayload(input: {
  model: string;
  kind: AiUsageKind;
  imageCount?: number;
  usage: RawCompletionUsage | null | undefined;
}): AiUsageLogPayload {
  const usage = extractAiTokenUsage(input.usage);
  const imageCount =
    input.kind === AI_USAGE_KIND.vision ? Math.max(0, input.imageCount ?? 0) : 0;

  return {
    model: input.model,
    kind: input.kind,
    imageCount,
    usage,
    estimatedCostUsd: estimateGpt4oMiniCostUsd(usage),
  };
}

/**
 * Log estruturado sem PII (sem prompt, resposta, base64 ou userId).
 * Breadcrumb Sentry quando DSN estiver configurado.
 */
export function logAiUsage(payload: AiUsageLogPayload): void {
  const line = {
    event: "ai.usage",
    model: payload.model,
    kind: payload.kind,
    imageCount: payload.imageCount,
    promptTokens: payload.usage.promptTokens,
    completionTokens: payload.usage.completionTokens,
    totalTokens: payload.usage.totalTokens,
    estimatedCostUsd: payload.estimatedCostUsd,
  };

  console.info(JSON.stringify(line));

  if (!process.env.SENTRY_DSN?.trim()) {
    return;
  }

  Sentry.addBreadcrumb({
    category: "ai.usage",
    level: "info",
    message: "OpenAI completion usage",
    data: {
      area: "ai",
      model: payload.model,
      kind: payload.kind,
      imageCount: payload.imageCount,
      promptTokens: payload.usage.promptTokens,
      completionTokens: payload.usage.completionTokens,
      totalTokens: payload.usage.totalTokens,
      estimatedCostUsd: payload.estimatedCostUsd,
    },
  });
}

function toNonNegativeIntOrNull(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.floor(value);
}

function roundUsd(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
