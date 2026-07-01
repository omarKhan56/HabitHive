import { db } from "@/lib/db";
import { cached } from "@/lib/redis";

const TRAILING_WINDOW_DAYS = 14;
const CACHE_TTL_SECONDS = 60 * 5;

export async function getUserCompletionRate(userId: string, days = TRAILING_WINDOW_DAYS) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const count = await db.checkIn.count({
    where: { userId, date: { gte: since } },
  });

  return count / days;
}

export async function getUserStreak(userId: string, hiveId: string) {
  const checkIns = await db.checkIn.findMany({
    where: { userId, hiveId },
    orderBy: { date: "desc" },
    select: { date: true },
    take: 365,
  });

  let streak = 0;
  let cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  for (const c of checkIns) {
    const d = new Date(c.date);
    d.setUTCHours(0, 0, 0, 0);
    if (d.getTime() === cursor.getTime()) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (d.getTime() < cursor.getTime()) {
      break;
    }
  }

  return streak;
}

/**
 * Hive Health Score: weighted combination of average completion rate,
 * miss-count trend, and chat engagement over the trailing 14 days (sec 2.4).
 * Cached in Redis with a short TTL to keep dashboards fast at scale.
 */
export async function getHiveHealthScore(hiveId: string) {
  return cached(`analytics:hive:${hiveId}:health`, CACHE_TTL_SECONDS, async () => {
    const since = new Date();
    since.setDate(since.getDate() - TRAILING_WINDOW_DAYS);

    const members = await db.hiveMember.findMany({ where: { hiveId } });
    if (members.length === 0) return { score: 0, breakdown: null };

    const memberCount = members.length;

    const checkInCount = await db.checkIn.count({
      where: { hiveId, date: { gte: since } },
    });
    const maxPossible = memberCount * TRAILING_WINDOW_DAYS;
    const completionRate = maxPossible === 0 ? 0 : checkInCount / maxPossible;

    const avgMissCount =
      members.reduce((sum: number, m: { missCount: number }) => sum + m.missCount, 0) /
      memberCount;
    // Normalize: 0 misses -> 1.0 healthy, 2+ misses (dissolution trigger) -> 0.0
    const missHealth = Math.max(0, 1 - avgMissCount / 2);

    const messageCount = await db.message.count({
      where: { hiveId, createdAt: { gte: since } },
    });
    // Normalize engagement against a soft target of ~3 messages/member/day
    const engagementTarget = memberCount * TRAILING_WINDOW_DAYS * 3;
    const engagement = Math.min(1, messageCount / Math.max(1, engagementTarget));

    const score = completionRate * 0.5 + missHealth * 0.3 + engagement * 0.2;

    return {
      score: Math.round(score * 100), // 0-100
      breakdown: {
        completionRate,
        missHealth,
        engagement,
      },
    };
  });
}

/** Computes a deterministic dissolution risk score (used by AI service to phrase a suggestion). */
export async function computeRiskScore(userId: string, hiveId: string): Promise<number> {
  const member = await db.hiveMember.findFirst({ where: { userId, hiveId } });
  const missCount = member?.missCount ?? 0;

  const completionRate = await getUserCompletionRate(userId, 7);

  // Simple, explainable rule-based scoring (logistic-style squashing).
  const raw = missCount * 0.4 + (1 - completionRate) * 0.6;
  return Math.min(1, Math.max(0, raw));
}