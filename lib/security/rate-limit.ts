const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export function checkRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true };
}

export function rateLimitAuthAction(identifier: string) {
  return checkRateLimit({
    key: `auth:${identifier}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
}

export function rateLimitAiAction(userId: string) {
  return checkRateLimit({
    key: `ai:${userId}`,
    limit: 20,
    windowMs: 24 * 60 * 60 * 1000,
  });
}
