import { Redis } from '@upstash/redis';
import type { Phase1Result } from '@/types/case';

const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const KEY_PREFIX = 'session:';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  redis = new Redis({ url, token });
  return redis;
}

export function isSessionStoreConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export async function savePhase1Session(caseId: string, phase1: Phase1Result): Promise<void> {
  const client = getRedis();
  if (!client) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Session store is not configured.');
    }
    return;
  }

  await client.set(`${KEY_PREFIX}${caseId}`, phase1, { ex: SESSION_TTL_SECONDS });
}

export async function getPhase1Session(caseId: string): Promise<Phase1Result | null> {
  const client = getRedis();
  if (!client) return null;

  const data = await client.get<Phase1Result>(`${KEY_PREFIX}${caseId}`);
  return data ?? null;
}

export async function deletePhase1Session(caseId: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  await client.del(`${KEY_PREFIX}${caseId}`);
}
