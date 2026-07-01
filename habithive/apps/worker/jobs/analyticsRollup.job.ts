import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";

const db = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

const TRAILING_WINDOW_DAYS = 14;
const CACHE_TTL_SECONDS = 60 * 60 * 25; // outlive the next day's rollup

/** Daily 00:30 — recompute and cache hive health scores, completion trends (sec 2.5). */
export async function analyticsRollupJob() {
  const hives = await db.hive.findMany({
    where: { status: "active" },
    include: { members: true },
  });

  const since = new Date();
  since.setDate(since.getDate() - TRAILING_WINDOW_DAYS);

  for (const hive of hives) {
    const memberCount = hive.members.length || 1;

    const checkInCount = await db.checkIn.count({
      where: { hiveId: hive.id, date: { gte: since } },
    });
    const completionRate = checkInCount / (memberCount * TRAILING_WINDOW_DAYS);

    const avgMissCount =
      hive.members.reduce((sum: number, m: { missCount: number }) => sum + m.missCount, 0) /
      memberCount;
    const missHealth = Math.max(0, 1 - avgMissCount / 2);

    const messageCount = await db.message.count({
      where: { hiveId: hive.id, createdAt: { gte: since } },
    });
    const engagementTarget = memberCount * TRAILING_WINDOW_DAYS * 3;
    const engagement = Math.min(1, messageCount / Math.max(1, engagementTarget));

    const score = completionRate * 0.5 + missHealth * 0.3 + engagement * 0.2;

    await redis.set(
      `analytics:hive:${hive.id}:health`,
      JSON.stringify({
        score: Math.round(score * 100),
        breakdown: { completionRate, missHealth, engagement },
      }),
      "EX",
      CACHE_TTL_SECONDS
    );
  }

  return { hivesProcessed: hives.length };
}