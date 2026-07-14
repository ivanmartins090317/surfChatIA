import {
  checkRateLimitInMemory,
  type RateLimitResult,
} from "@/lib/security/rate-limit-memory";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { reportServerError } from "@/lib/observability/report-server-error";

export const AUTH_RATE_LIMIT = {
  limit: 10,
  windowMs: 15 * 60 * 1000,
} as const;

export const AI_RATE_LIMIT = {
  limit: 20,
  windowMs: 24 * 60 * 60 * 1000,
} as const;

interface CheckRateLimitInput {
  key: string;
  limit: number;
  windowMs: number;
}

interface RateLimitRpcRow {
  allowed: boolean;
  retry_after_ms?: number;
}

function shouldUseMemoryBackend(): boolean {
  if (process.env.RATE_LIMIT_BACKEND === "memory") {
    return true;
  }

  if (process.env.NODE_ENV === "test") {
    return true;
  }

  return !hasAdminClient();
}

function assertProductionBackend(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  if (shouldUseMemoryBackend()) {
    throw new Error(
      "Rate limit persistente exige SUPABASE_SERVICE_ROLE_KEY em produção.",
    );
  }
}

interface RateLimitSupabaseRpc {
  rpc(
    fn: "check_rate_limit",
    args: {
      p_bucket_key: string;
      p_limit: number;
      p_window_seconds: number;
    },
  ): Promise<{
    data: RateLimitRpcRow | null;
    error: { message: string } | null;
  }>;
}

async function invokeCheckRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ data: RateLimitRpcRow | null; error: Error | null }> {
  const supabase = createAdminClient() as unknown as RateLimitSupabaseRpc;
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_bucket_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  return {
    data,
    error: error ? new Error(error.message) : null,
  };
}

async function checkRateLimitPersistent({
  key,
  limit,
  windowMs,
}: CheckRateLimitInput): Promise<RateLimitResult> {
  assertProductionBackend();

  const windowSeconds = Math.ceil(windowMs / 1000);
  const { data, error } = await invokeCheckRateLimit(key, limit, windowSeconds);

  if (error) {
    reportServerError(error, {
      area: "rate-limit",
      operation: "check_rate_limit",
    });
    throw new Error("Não foi possível validar limite de uso. Tente novamente.");
  }

  const parsed = data as RateLimitRpcRow | null;
  if (!parsed || typeof parsed.allowed !== "boolean") {
    throw new Error("Resposta inválida ao validar limite de uso.");
  }

  return {
    allowed: parsed.allowed,
    retryAfterMs: parsed.retry_after_ms,
  };
}

export async function checkRateLimit(
  input: CheckRateLimitInput,
): Promise<RateLimitResult> {
  if (shouldUseMemoryBackend()) {
    return checkRateLimitInMemory(input);
  }

  return checkRateLimitPersistent(input);
}

export async function rateLimitAuthAction(
  identifier: string,
): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `auth:${identifier}`,
    limit: AUTH_RATE_LIMIT.limit,
    windowMs: AUTH_RATE_LIMIT.windowMs,
  });
}

export async function rateLimitAiAction(
  userId: string,
): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `ai:${userId}`,
    limit: AI_RATE_LIMIT.limit,
    windowMs: AI_RATE_LIMIT.windowMs,
  });
}
