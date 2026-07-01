import { Redis } from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null, // required by BullMQ
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/** Simple cache-aside helper used by Analytics Service etc. */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit) as T;

  const value = await fn();
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  return value;
}
