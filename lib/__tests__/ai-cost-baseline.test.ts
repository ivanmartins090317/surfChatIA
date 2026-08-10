import { describe, expect, it } from "vitest";
import {
  averageBaselineCostUsd,
  buildAiCostBaselineRows,
  buildPlanMarginSnapshot,
  COST_SHARE_GO_NO_GO_MAX,
} from "@/lib/ai/cost-baseline";

describe("buildAiCostBaselineRows", () => {
  it("gera uma linha por perfil com custo positivo", () => {
    const rows = buildAiCostBaselineRows();
    expect(rows).toHaveLength(4);
    for (const row of rows) {
      expect(row.estimatedCostUsd).toBeGreaterThan(0);
      expect(row.usage.promptTokens).not.toBeNull();
      expect(row.usage.completionTokens).not.toBeNull();
      expect(row.usage.totalTokens).toBe(
        (row.usage.promptTokens as number) +
          (row.usage.completionTokens as number),
      );
    }
  });
});

describe("averageBaselineCostUsd", () => {
  it("retorna média ponderada estável", () => {
    const avg = averageBaselineCostUsd();
    expect(avg).toBeGreaterThan(0.001);
    expect(avg).toBeLessThan(0.01);
  });
});

describe("buildPlanMarginSnapshot", () => {
  it("valida Go Surfista com custo baseline e câmbio 5.5", () => {
    const costUsd = averageBaselineCostUsd();
    const surfista = buildPlanMarginSnapshot({
      plan: "surfista",
      priceBrl: 39,
      credits: 8,
      costPerCreditUsd: costUsd,
      usdToBrl: 5.5,
    });

    expect(surfista.revenuePerCreditBrl).toBeCloseTo(4.875, 3);
    expect(surfista.costShareOfRevenue).toBeLessThan(COST_SHARE_GO_NO_GO_MAX);
    expect(surfista.passesGoNoGo).toBe(true);
  });

  it("reprova quando custo passa de 25% da receita", () => {
    const snapshot = buildPlanMarginSnapshot({
      plan: "surfista",
      priceBrl: 39,
      credits: 8,
      costPerCreditUsd: 1,
      usdToBrl: 5.5,
    });
    expect(snapshot.passesGoNoGo).toBe(false);
  });
});
