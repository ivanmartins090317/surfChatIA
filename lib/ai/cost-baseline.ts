import {
  estimateGpt4oMiniCostUsd,
  type AiTokenUsage,
} from "@/lib/ai/usage-log";

/**
 * Perfis representativos (tokens) para baseline de margem — Trilha G.
 * Valores calibrados pelo tamanho dos prompts em `lib/ai/*-prompt.ts`
 * + custo típico de visão `detail: high` (1 imagem ~1–2k tokens de input;
 * vídeo ~8 frames via VIDEO_FRAME_COUNT).
 *
 * Substituir pelas médias reais dos logs `ai.usage` após a amostra operacional.
 */
export const AI_COST_BASELINE_PROFILES = {
  performance_image: {
    analysisType: "performance",
    label: "Performance (1 imagem)",
    promptTokens: 5_500,
    completionTokens: 850,
    imageCount: 1,
  },
  performance_video: {
    analysisType: "performance",
    label: "Performance (vídeo ~8 frames)",
    promptTokens: 20_000,
    completionTokens: 1_400,
    imageCount: 8,
  },
  board_spec: {
    analysisType: "board_spec",
    label: "Prancha mágica (texto)",
    promptTokens: 2_800,
    completionTokens: 1_100,
    imageCount: 0,
  },
  board_match: {
    analysisType: "board_match",
    label: "Compatibilidade (~4 fotos)",
    promptTokens: 13_000,
    completionTokens: 750,
    imageCount: 4,
  },
} as const;

export type AiCostBaselineKey = keyof typeof AI_COST_BASELINE_PROFILES;

export interface AiCostBaselineRow {
  key: AiCostBaselineKey;
  analysisType: string;
  label: string;
  imageCount: number;
  usage: AiTokenUsage;
  estimatedCostUsd: number;
}

export function buildAiCostBaselineRows(): AiCostBaselineRow[] {
  return (
    Object.entries(AI_COST_BASELINE_PROFILES) as Array<
      [AiCostBaselineKey, (typeof AI_COST_BASELINE_PROFILES)[AiCostBaselineKey]]
    >
  ).map(([key, profile]) => {
    const usage: AiTokenUsage = {
      promptTokens: profile.promptTokens,
      completionTokens: profile.completionTokens,
      totalTokens: profile.promptTokens + profile.completionTokens,
    };
    const estimatedCostUsd = estimateGpt4oMiniCostUsd(usage);
    if (estimatedCostUsd === null) {
      throw new Error(`Baseline sem custo: ${key}`);
    }
    return {
      key,
      analysisType: profile.analysisType,
      label: profile.label,
      imageCount: profile.imageCount,
      usage,
      estimatedCostUsd,
    };
  });
}

/** Média ponderada usada como “custo médio por crédito” no Go/No-Go. */
export function averageBaselineCostUsd(
  weights: Partial<Record<AiCostBaselineKey, number>> = {
    performance_image: 1,
    performance_video: 2,
    board_spec: 2,
    board_match: 1,
  },
): number {
  const rows = buildAiCostBaselineRows();
  let weightedSum = 0;
  let totalWeight = 0;

  for (const row of rows) {
    const weight = weights[row.key] ?? 0;
    if (weight <= 0) continue;
    weightedSum += row.estimatedCostUsd * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    throw new Error("Pesos de baseline inválidos.");
  }

  return Math.round((weightedSum / totalWeight) * 1_000_000) / 1_000_000;
}

export interface PlanMarginSnapshot {
  plan: "surfista" | "pro";
  priceBrl: number;
  credits: number;
  revenuePerCreditBrl: number;
  costPerCreditBrl: number;
  costShareOfRevenue: number;
  monthlyAiCostFullUseBrl: number;
  passesGoNoGo: boolean;
}

/** Teto Spec: custo ≤ 25% da receita por crédito no Surfista. */
export const COST_SHARE_GO_NO_GO_MAX = 0.25;

export function buildPlanMarginSnapshot(input: {
  plan: "surfista" | "pro";
  priceBrl: number;
  credits: number;
  costPerCreditUsd: number;
  usdToBrl: number;
}): PlanMarginSnapshot {
  const revenuePerCreditBrl = input.priceBrl / input.credits;
  const costPerCreditBrl = input.costPerCreditUsd * input.usdToBrl;
  const costShareOfRevenue = costPerCreditBrl / revenuePerCreditBrl;

  return {
    plan: input.plan,
    priceBrl: input.priceBrl,
    credits: input.credits,
    revenuePerCreditBrl: roundMoney(revenuePerCreditBrl),
    costPerCreditBrl: roundMoney(costPerCreditBrl),
    costShareOfRevenue: roundMoney(costShareOfRevenue),
    monthlyAiCostFullUseBrl: roundMoney(costPerCreditBrl * input.credits),
    passesGoNoGo: costShareOfRevenue <= COST_SHARE_GO_NO_GO_MAX,
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
