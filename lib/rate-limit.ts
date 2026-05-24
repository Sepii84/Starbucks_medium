type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateBucket>();

export function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions
) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true as const, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false as const,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    };
  }

  bucket.count += 1;
  return { ok: true as const, retryAfter: 0 };
}

export function rateLimitMessage(retryAfter: number) {
  return `Too many requests. Please try again in ${retryAfter} seconds.`;
}
