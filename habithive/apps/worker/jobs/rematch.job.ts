import { Redis } from "ioredis";
import type { Habit } from "@prisma/client";

const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

interface RematchJobData {
  memberIds: string[];
  habit: Habit;
}

/**
 * Re-inserts a dissolved hive's members into the matching pool, then the
 * periodic matching sweep (or a triggered run) re-forms hives from the pool.
 */
export async function rematchJob(data: RematchJobData) {
  const { memberIds, habit } = data;
  if (!memberIds?.length) return { reinserted: 0 };

  await redis.sadd(`matching:pool:${habit}`, ...memberIds);

  return { reinserted: memberIds.length };
}
