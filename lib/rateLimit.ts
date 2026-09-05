import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { getClientIp } from '@/lib/apiHelpers';

type RateLimitType = 'analyze' | 'clarify';

let analyzeLimiter: Ratelimit | null = null;
let clarifyLimiter: Ratelimit | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  return new Redis({ url, token });
}

function getLimiter(type: RateLimitType): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  if (type === 'analyze') {
    if (!analyzeLimiter) {
      analyzeLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 h'),
        prefix: 'rl:analyze',
      });
    }
    return analyzeLimiter;
  }

  if (!clarifyLimiter) {
    clarifyLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      prefix: 'rl:clarify',
    });
  }
  return clarifyLimiter;
}

export function isRateLimitConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export async function checkRateLimit(
  req: NextRequest,
  type: RateLimitType
): Promise<NextResponse | null> {
  const limiter = getLimiter(type);
  if (!limiter) return null;

  const ip = getClientIp(req);
  const { success, reset } = await limiter.limit(ip);

  if (success) return null;

  const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));

  return NextResponse.json(
    {
      error: 'Rate limit exceeded. Please try again later.',
    },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSec) },
    }
  );
}
