type RateRecord = {
  count: number;
  resetAt: number;
};

const inMemoryBuckets = new Map<string, RateRecord>();

export interface RateLimitConfig {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

async function checkRedisRateLimit(config: RateLimitConfig): Promise<RateLimitResult | null> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) {
    return null;
  }

  const bucketKey = `ratelimit:${config.key}`;
  const ttlSeconds = Math.ceil(config.windowMs / 1000);
  const now = Date.now();

  const incrRes = await fetch(`${redisUrl}/incr/${encodeURIComponent(bucketKey)}`, {
    headers: { Authorization: `Bearer ${redisToken}` },
    cache: "no-store",
  });

  if (!incrRes.ok) {
    return null;
  }

  const incrBody = (await incrRes.json()) as { result?: number };
  const count = Number(incrBody.result || 0);

  if (count === 1) {
    await fetch(`${redisUrl}/expire/${encodeURIComponent(bucketKey)}/${ttlSeconds}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
      cache: "no-store",
    });
  }

  return {
    allowed: count <= config.limit,
    remaining: Math.max(0, config.limit - count),
    resetAt: now + config.windowMs,
  };
}

function checkInMemoryRateLimit(config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const existing = inMemoryBuckets.get(config.key);

  if (!existing || existing.resetAt <= now) {
    inMemoryBuckets.set(config.key, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt: now + config.windowMs,
    };
  }

  existing.count += 1;
  inMemoryBuckets.set(config.key, existing);

  return {
    allowed: existing.count <= config.limit,
    remaining: Math.max(0, config.limit - existing.count),
    resetAt: existing.resetAt,
  };
}

export async function enforceRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const redisResult = await checkRedisRateLimit(config);
  if (redisResult) {
    return redisResult;
  }
  return checkInMemoryRateLimit(config);
}
