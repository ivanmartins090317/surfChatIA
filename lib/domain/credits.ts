import type { CreditsSnapshot, UserPlan } from "@/lib/domain/types";

/** Cotas mensais/totais por plano (free = 2 totais quando free_quota_granted). */
export const PLAN_CREDIT_QUOTAS: Record<UserPlan, number> = {
  free: 2,
  surfista: 8,
  pro: 30,
  coach: 100,
};

export const MAX_SYSTEM_AUTO_RETRIES = 2;

export const NO_CREDITS_MESSAGE =
  "Sem créditos. Veja os planos para continuar.";

export function resolvePlanQuota(
  plan: UserPlan,
  freeQuotaGranted: boolean,
): number {
  if (plan === "free") {
    return freeQuotaGranted ? PLAN_CREDIT_QUOTAS.free : 0;
  }
  return PLAN_CREDIT_QUOTAS[plan];
}

/** remaining = cota − usados + avulsos − reservados */
export function computeCreditsRemaining(input: {
  plan: UserPlan;
  freeQuotaGranted: boolean;
  creditsPeriodUsed: number;
  creditsBalance: number;
  creditsReserved?: number;
}): number {
  const quota = resolvePlanQuota(input.plan, input.freeQuotaGranted);
  const reserved = input.creditsReserved ?? 0;
  return Math.max(
    0,
    quota - input.creditsPeriodUsed + input.creditsBalance - reserved,
  );
}

export function toCreditsSnapshot(input: {
  plan: UserPlan;
  freeQuotaGranted: boolean;
  creditsPeriodUsed: number;
  creditsBalance: number;
  creditsReserved?: number;
}): CreditsSnapshot {
  const reserved = input.creditsReserved ?? 0;
  const planQuota = resolvePlanQuota(input.plan, input.freeQuotaGranted);
  return {
    plan: input.plan,
    remaining: computeCreditsRemaining({ ...input, creditsReserved: reserved }),
    periodUsed: input.creditsPeriodUsed,
    balance: input.creditsBalance,
    reserved,
    planQuota,
    freeQuotaGranted: input.freeQuotaGranted,
  };
}

export function isNoCreditsMessage(message: string | null | undefined): boolean {
  if (!message) return false;
  return message.trim().toLowerCase().startsWith("sem créditos");
}

export function formatCreditsLabel(remaining: number): string {
  const n = Math.max(0, remaining);
  return n === 1 ? "1 crédito" : `${n} créditos`;
}
