import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  computeCreditsRemaining,
  formatCreditsLabel,
  isNoCreditsMessage,
  MAX_SYSTEM_AUTO_RETRIES,
  NO_CREDITS_MESSAGE,
  resolvePlanQuota,
  toCreditsSnapshot,
} from "@/lib/domain/credits";
import {
  canStartAnalysis,
  debitCredit,
  getRemainingCredits,
  NoCreditsError,
  releaseAnalysisCredit,
  reserveAnalysisCredit,
  resetCreditsMemoryStore,
  runWithAnalysisCreditGate,
  seedCreditsMemoryStore,
  withSystemAutoRetries,
} from "@/services/usage-service";

describe("domínio de créditos", () => {
  it("resolve cota free só com free_quota_granted", () => {
    expect(resolvePlanQuota("free", true)).toBe(2);
    expect(resolvePlanQuota("free", false)).toBe(0);
    expect(resolvePlanQuota("surfista", false)).toBe(8);
  });

  it("calcula remaining = cota − usados + avulsos − reservados", () => {
    expect(
      computeCreditsRemaining({
        plan: "free",
        freeQuotaGranted: true,
        creditsPeriodUsed: 1,
        creditsBalance: 0,
        creditsReserved: 0,
      }),
    ).toBe(1);

    expect(
      computeCreditsRemaining({
        plan: "free",
        freeQuotaGranted: true,
        creditsPeriodUsed: 0,
        creditsBalance: 3,
        creditsReserved: 1,
      }),
    ).toBe(4);
  });

  it("conta antiga sem grant fica sem créditos", () => {
    const snapshot = toCreditsSnapshot({
      plan: "free",
      freeQuotaGranted: false,
      creditsPeriodUsed: 0,
      creditsBalance: 0,
    });
    expect(snapshot.remaining).toBe(0);
    expect(snapshot.planQuota).toBe(0);
  });

  it("formata e detecta mensagem sem créditos", () => {
    expect(formatCreditsLabel(0)).toBe("0 créditos");
    expect(formatCreditsLabel(1)).toBe("1 crédito");
    expect(isNoCreditsMessage(NO_CREDITS_MESSAGE)).toBe(true);
    expect(isNoCreditsMessage("Limite diário de análises atingido.")).toBe(
      false,
    );
  });
});

describe("usage-service (memory)", () => {
  beforeEach(() => {
    resetCreditsMemoryStore();
    vi.stubEnv("CREDITS_BACKEND", "memory");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetCreditsMemoryStore();
  });

  it("permite iniciar com créditos e bloqueia sem créditos", async () => {
    const userId = "user-credits-1";
    seedCreditsMemoryStore(userId, { freeQuotaGranted: true });

    await expect(canStartAnalysis(userId)).resolves.toBe(true);
    await expect(getRemainingCredits(userId)).resolves.toBe(2);

    seedCreditsMemoryStore(userId, {
      freeQuotaGranted: true,
      creditsPeriodUsed: 2,
    });
    await expect(canStartAnalysis(userId)).resolves.toBe(false);
  });

  it("reserva impede race de segundo consumo paralelo", async () => {
    const userId = "user-race";
    seedCreditsMemoryStore(userId, {
      freeQuotaGranted: true,
      creditsPeriodUsed: 1,
    });

    const first = await reserveAnalysisCredit(userId);
    const second = await reserveAnalysisCredit(userId);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
  });

  it("debita só no commit e libera hold em falha", async () => {
    const userId = "user-gate";
    seedCreditsMemoryStore(userId, { freeQuotaGranted: true });

    await expect(
      runWithAnalysisCreditGate({
        userId,
        analysisType: "performance",
        getAnalysisId: () => "analysis-1",
        operation: async () => ({ ok: true }),
      }),
    ).resolves.toEqual({ ok: true });

    await expect(getRemainingCredits(userId)).resolves.toBe(1);

    await expect(
      runWithAnalysisCreditGate({
        userId,
        analysisType: "performance",
        getAnalysisId: () => "analysis-2",
        operation: async () => {
          throw new Error("falha de sistema");
        },
      }),
    ).rejects.toThrow("falha de sistema");

    await expect(getRemainingCredits(userId)).resolves.toBe(1);
  });

  it("lança NoCreditsError ao debitar sem saldo", async () => {
    const userId = "user-empty";
    seedCreditsMemoryStore(userId, {
      freeQuotaGranted: false,
      creditsPeriodUsed: 0,
    });

    await expect(
      debitCredit({
        userId,
        analysisType: "board_match",
        analysisId: null,
      }),
    ).rejects.toBeInstanceOf(NoCreditsError);
  });

  it("withSystemAutoRetries tenta até 2 reanálises automáticas", async () => {
    let attempts = 0;
    const result = await withSystemAutoRetries(async () => {
      attempts += 1;
      if (attempts <= MAX_SYSTEM_AUTO_RETRIES) {
        throw new Error("timeout ia");
      }
      return "ok";
    });

    expect(result).toBe("ok");
    expect(attempts).toBe(MAX_SYSTEM_AUTO_RETRIES + 1);
  });

  it("withSystemAutoRetries não retenta Sem créditos", async () => {
    let attempts = 0;
    await expect(
      withSystemAutoRetries(async () => {
        attempts += 1;
        throw new NoCreditsError();
      }),
    ).rejects.toBeInstanceOf(NoCreditsError);
    expect(attempts).toBe(1);
  });

  it("release reduz reserved", async () => {
    const userId = "user-release";
    seedCreditsMemoryStore(userId, { freeQuotaGranted: true });
    await reserveAnalysisCredit(userId);
    await releaseAnalysisCredit(userId);
    await expect(getRemainingCredits(userId)).resolves.toBe(2);
  });
});
