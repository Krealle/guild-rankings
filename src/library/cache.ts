import { redis } from "./redis";

const TTL_SECONDS = 12 * 60 * 60; // 12 hours

export async function getCached<T>(key: string): Promise<T | null> {
  const data = await redis.get<T>(key);
  return data ?? null;
}

export async function setCached<T>(
  key: string,
  value: T,
  ttl?: number
): Promise<void> {
  await redis.set(key, value, { ex: ttl ?? TTL_SECONDS });
}
