import {
  computeCreditsRemaining,
  MAX_SYSTEM_AUTO_RETRIES,
  NO_CREDITS_MESSAGE,
  toCreditsSnapshot,
} from "@/lib/domain/credits";
import type {
  AnalysisCreditType,
  CreditsSnapshot,
  Profile,
  UserPlan,
} from "@/lib/domain/types";
import { reportServerError } from "@/lib/observability/report-server-error";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/services/profile-service";

export class NoCreditsError extends Error {
  constructor(message = NO_CREDITS_MESSAGE) {
    super(message);
    this.name = "NoCreditsError";
  }
}

interface MemoryCreditsState {
  plan: UserPlan;
  freeQuotaGranted: boolean;
  creditsBalance: number;
  creditsPeriodUsed: number;
  creditsReserved: number;
}

const memoryStore = new Map<string, MemoryCreditsState>();

interface CreditGateRpcRow {
  allowed?: boolean;
  remaining?: number;
  success?: boolean;
  released?: boolean;
}

interface CreditsSupabaseRpc {
  rpc(
    fn: string,
    args: Record<string, unknown>,
  ): Promise<{ data: CreditGateRpcRow | null; error: { message: string } | null }>;
}

function shouldUseMemoryBackend(): boolean {
  if (process.env.CREDITS_BACKEND === "memory") return true;
  if (process.env.NODE_ENV === "test") return true;
  return !hasAdminClient();
}

export function resetCreditsMemoryStore(): void {
  memoryStore.clear();
}

export function seedCreditsMemoryStore(
  userId: string,
  state: Partial<MemoryCreditsState> & { freeQuotaGranted?: boolean },
): void {
  memoryStore.set(userId, {
    plan: state.plan ?? "free",
    freeQuotaGranted: state.freeQuotaGranted ?? true,
    creditsBalance: state.creditsBalance ?? 0,
    creditsPeriodUsed: state.creditsPeriodUsed ?? 0,
    creditsReserved: state.creditsReserved ?? 0,
  });
}

function getOrCreateMemoryState(userId: string): MemoryCreditsState {
  const existing = memoryStore.get(userId);
  if (existing) return existing;
  const created: MemoryCreditsState = {
    plan: "free",
    freeQuotaGranted: true,
    creditsBalance: 0,
    creditsPeriodUsed: 0,
    creditsReserved: 0,
  };
  memoryStore.set(userId, created);
  return created;
}

function snapshotFromMemory(state: MemoryCreditsState): CreditsSnapshot {
  return toCreditsSnapshot({
    plan: state.plan,
    freeQuotaGranted: state.freeQuotaGranted,
    creditsPeriodUsed: state.creditsPeriodUsed,
    creditsBalance: state.creditsBalance,
    creditsReserved: state.creditsReserved,
  });
}

function snapshotFromProfile(profile: Profile): CreditsSnapshot {
  return toCreditsSnapshot({
    plan: profile.plan ?? "free",
    freeQuotaGranted: profile.free_quota_granted ?? false,
    creditsPeriodUsed: profile.credits_period_used ?? 0,
    creditsBalance: profile.credits_balance ?? 0,
    creditsReserved: profile.credits_reserved ?? 0,
  });
}

function defaultEmptySnapshot(): CreditsSnapshot {
  return toCreditsSnapshot({
    plan: "free",
    freeQuotaGranted: false,
    creditsPeriodUsed: 0,
    creditsBalance: 0,
    creditsReserved: 0,
  });
}

export async function getCreditsSnapshot(
  userId: string,
): Promise<CreditsSnapshot> {
  if (shouldUseMemoryBackend()) {
    return snapshotFromMemory(getOrCreateMemoryState(userId));
  }

  const profile = await getProfile(userId);
  if (!profile) return defaultEmptySnapshot();
  return snapshotFromProfile(profile);
}

export async function getRemainingCredits(userId: string): Promise<number> {
  const snapshot = await getCreditsSnapshot(userId);
  return snapshot.remaining;
}

export async function canStartAnalysis(userId: string): Promise<boolean> {
  const remaining = await getRemainingCredits(userId);
  return remaining >= 1;
}

function reserveInMemory(userId: string): { allowed: boolean; remaining: number } {
  const state = getOrCreateMemoryState(userId);
  const remaining = computeCreditsRemaining({
    plan: state.plan,
    freeQuotaGranted: state.freeQuotaGranted,
    creditsPeriodUsed: state.creditsPeriodUsed,
    creditsBalance: state.creditsBalance,
    creditsReserved: state.creditsReserved,
  });
  if (remaining < 1) {
    return { allowed: false, remaining: 0 };
  }
  state.creditsReserved += 1;
  return { allowed: true, remaining: remaining - 1 };
}

function releaseInMemory(userId: string): void {
  const state = memoryStore.get(userId);
  if (!state) return;
  state.creditsReserved = Math.max(0, state.creditsReserved - 1);
}

function commitInMemory(userId: string): { success: boolean; remaining: number } {
  const state = getOrCreateMemoryState(userId);
  if (state.creditsReserved < 1) {
    const remaining = computeCreditsRemaining({
      plan: state.plan,
      freeQuotaGranted: state.freeQuotaGranted,
      creditsPeriodUsed: state.creditsPeriodUsed,
      creditsBalance: state.creditsBalance,
      creditsReserved: 0,
    });
    if (remaining < 1) {
      return { success: false, remaining: 0 };
    }
    state.creditsPeriodUsed += 1;
  } else {
    state.creditsReserved -= 1;
    state.creditsPeriodUsed += 1;
  }
  return {
    success: true,
    remaining: snapshotFromMemory(state).remaining,
  };
}

async function invokeCreditsRpc(
  fn: "reserve_analysis_credit" | "release_analysis_credit" | "commit_analysis_credit",
  args: Record<string, unknown>,
): Promise<CreditGateRpcRow> {
  const supabase = createAdminClient() as unknown as CreditsSupabaseRpc;
  const { data, error } = await supabase.rpc(fn, args);

  if (error) {
    reportServerError(error, { area: "rate-limit", operation: fn });
    throw new Error("Não foi possível validar créditos. Tente novamente.");
  }

  if (!data || typeof data !== "object") {
    throw new Error("Resposta inválida ao validar créditos.");
  }

  return data;
}

export async function reserveAnalysisCredit(
  userId: string,
): Promise<{ allowed: boolean; remaining: number }> {
  if (shouldUseMemoryBackend()) {
    return reserveInMemory(userId);
  }

  const data = await invokeCreditsRpc("reserve_analysis_credit", {
    p_user_id: userId,
  });

  return {
    allowed: Boolean(data.allowed),
    remaining: typeof data.remaining === "number" ? data.remaining : 0,
  };
}

export async function releaseAnalysisCredit(userId: string): Promise<void> {
  if (shouldUseMemoryBackend()) {
    releaseInMemory(userId);
    return;
  }

  await invokeCreditsRpc("release_analysis_credit", { p_user_id: userId });
}

export async function debitCredit(input: {
  userId: string;
  analysisType: AnalysisCreditType;
  analysisId: string | null;
  reason?: string;
}): Promise<number> {
  if (shouldUseMemoryBackend()) {
    const result = commitInMemory(input.userId);
    if (!result.success) {
      throw new NoCreditsError();
    }
    return result.remaining;
  }

  const data = await invokeCreditsRpc("commit_analysis_credit", {
    p_user_id: input.userId,
    p_analysis_type: input.analysisType,
    p_analysis_id: input.analysisId,
    p_reason: input.reason ?? "analysis",
  });

  if (!data.success) {
    throw new NoCreditsError();
  }

  return typeof data.remaining === "number" ? data.remaining : 0;
}

/** Reserva crédito ou lança NoCreditsError. */
export async function assertCreditsAndReserve(userId: string): Promise<void> {
  const result = await reserveAnalysisCredit(userId);
  if (!result.allowed) {
    throw new NoCreditsError();
  }
}

function isNonRetryableCreditOrLimitError(error: unknown): boolean {
  if (error instanceof NoCreditsError) return true;
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.startsWith("sem créditos") ||
    message.includes("limite diário de análises")
  );
}

/**
 * Até 2 reanálises automáticas após falha de sistema (1 tentativa + 2 retries).
 * Não retenta erros de créditos ou rate limit.
 */
export async function withSystemAutoRetries<T>(
  operation: () => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  const maxAttempts = MAX_SYSTEM_AUTO_RETRIES + 1;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (isNonRetryableCreditOrLimitError(error)) {
        throw error;
      }
      if (attempt >= MAX_SYSTEM_AUTO_RETRIES) {
        break;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Erro ao processar análise.");
}

/**
 * Gate completo: reserva crédito → executa → debita no sucesso ou libera no erro.
 */
export async function runWithAnalysisCreditGate<T>(input: {
  userId: string;
  analysisType: AnalysisCreditType;
  getAnalysisId: (result: T) => string | null;
  operation: () => Promise<T>;
}): Promise<T> {
  await assertCreditsAndReserve(input.userId);
  let committed = false;

  try {
    const result = await input.operation();
    await debitCredit({
      userId: input.userId,
      analysisType: input.analysisType,
      analysisId: input.getAnalysisId(result),
    });
    committed = true;
    return result;
  } finally {
    if (!committed) {
      try {
        await releaseAnalysisCredit(input.userId);
      } catch (error) {
        reportServerError(error, {
          area: "rate-limit",
          operation: "release_analysis_credit",
          userId: input.userId,
        });
      }
    }
  }
}

/** Lê snapshot via client autenticado (RLS) — útil quando admin não está disponível. */
export async function getCreditsSnapshotFromSession(
  userId: string,
): Promise<CreditsSnapshot> {
  if (shouldUseMemoryBackend()) {
    return getCreditsSnapshot(userId);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "plan, credits_balance, credits_period_used, credits_reserved, free_quota_granted",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return defaultEmptySnapshot();
  }

  return toCreditsSnapshot({
    plan: (data.plan as UserPlan) ?? "free",
    freeQuotaGranted: Boolean(data.free_quota_granted),
    creditsPeriodUsed: Number(data.credits_period_used ?? 0),
    creditsBalance: Number(data.credits_balance ?? 0),
    creditsReserved: Number(data.credits_reserved ?? 0),
  });
}
