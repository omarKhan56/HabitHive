// habithive/apps/web/lib/services/matching.service.ts
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { Habit, Prisma } from "@prisma/client";

const HIVE_SIZE = 5; // Lowered from 5 → allows testing with just 2 users. Set back to 5 for production.
const MIN_SCORE_THRESHOLD = 50; // Fixed from 120 → 50 is the minimum possible pair score (same habit base), so a hive always forms when enough users are in the pool.
const CHECKIN_WINDOW_MINUTES = 60;

interface PoolUser {
  id: string;
  timezone: string;
  language: string;
  preferredCheckinTime: string;
}

function minutesSinceMidnight(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function pairScore(a: PoolUser, b: PoolUser): number {
  let score = 50;
  if (a.timezone === b.timezone) score += 20;
  const diff = Math.abs(
    minutesSinceMidnight(a.preferredCheckinTime) -
      minutesSinceMidnight(b.preferredCheckinTime)
  );
  if (diff <= CHECKIN_WINDOW_MINUTES) score += 20;
  if (a.language === b.language) score += 10;
  return score;
}

function buildGraph(users: PoolUser[]): number[][] {
  const n = users.length;
  const graph: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s = pairScore(users[i], users[j]);
      graph[i][j] = s;
      graph[j][i] = s;
    }
  }
  return graph;
}

function averageEdgeWeight(group: number[], graph: number[][]): number {
  let total = 0;
  let count = 0;
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      total += graph[group[i]][group[j]];
      count++;
    }
  }
  return count === 0 ? 0 : total / count;
}

function greedyCluster(users: PoolUser[], graph: number[][]): number[][] {
  const n = users.length;
  const used = new Array(n).fill(false);
  const groups: number[][] = [];

  while (true) {
    const remaining = [];
    for (let i = 0; i < n; i++) if (!used[i]) remaining.push(i);
    if (remaining.length < HIVE_SIZE) break;

    let seed = remaining[0];
    let bestSeedScore = -Infinity;
    for (const i of remaining) {
      const total = remaining.reduce((acc, j) => (i === j ? acc : acc + graph[i][j]), 0);
      if (total > bestSeedScore) {
        bestSeedScore = total;
        seed = i;
      }
    }

    const group = [seed];
    const groupRemaining = remaining.filter((i) => i !== seed);

    while (group.length < HIVE_SIZE && groupRemaining.length > 0) {
      let bestIdx = -1;
      let bestScore = -Infinity;
      for (let k = 0; k < groupRemaining.length; k++) {
        const candidate = groupRemaining[k];
        const scoreWithGroup = group.reduce((acc, g) => acc + graph[g][candidate], 0);
        if (scoreWithGroup > bestScore) {
          bestScore = scoreWithGroup;
          bestIdx = k;
        }
      }
      if (bestIdx === -1) break;
      group.push(groupRemaining[bestIdx]);
      groupRemaining.splice(bestIdx, 1);
    }

    if (group.length === HIVE_SIZE) {
      groups.push(group);
      for (const i of group) used[i] = true;
    } else {
      break;
    }
  }

  return groups;
}

export async function runMatchingForHabit(habit: Habit, relaxedWindowMinutes?: number) {
  const userIds = await redis.smembers(`matching:pool:${habit}`);
  if (userIds.length < HIVE_SIZE) return { formed: 0 };

  const users = await db.user.findMany({
    where: { id: { in: userIds }, currentHiveId: null },
    select: { id: true, timezone: true, language: true, preferredCheckinTime: true },
  });

  if (users.length < HIVE_SIZE) return { formed: 0 };

  const graph = buildGraph(users);
  const groups = greedyCluster(users, graph);

  let formed = 0;
  for (const group of groups) {
    const avgScore = averageEdgeWeight(group, graph);
    const threshold = relaxedWindowMinutes ? MIN_SCORE_THRESHOLD - 20 : MIN_SCORE_THRESHOLD;
    if (avgScore < threshold) continue;

    const memberIds = group.map((i) => users[i].id);
    let createdHiveId = "";

    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const hive = await tx.hive.create({
        data: {
          status: "active",
          habit,
          compatibilityScore: Math.round(avgScore),
        },
      });
      createdHiveId = hive.id;

      await tx.hiveMember.createMany({
        data: memberIds.map((userId) => ({ hiveId: hive.id, userId })),
      });

      await tx.user.updateMany({
        where: { id: { in: memberIds } },
        data: { currentHiveId: hive.id },
      });

      await tx.notification.createMany({
        data: memberIds.map((userId) => ({
          userId,
          type: "rematch" as const,
          payload: { hiveId: hive.id, event: "hive_formed" } as Prisma.InputJsonValue,
        })),
      });
    });

    await redis.srem(`matching:pool:${habit}`, ...memberIds);
    formed++;

    await redis.publish(
      "hive:events",
      JSON.stringify({ type: "hive:formed", hiveId: createdHiveId, memberIds })
    );
  }

  return { formed };
}

export async function reinsertIntoPool(userIds: string[], habit: Habit) {
  if (userIds.length === 0) return;
  await redis.sadd(`matching:pool:${habit}`, ...userIds);
}