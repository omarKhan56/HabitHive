import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";
import { queue } from "../scheduler";
import { notifyMany } from "./_shared/notify";

const db = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

const MISS_THRESHOLD = 2;

/**
 * For each active hive, increments miss_count for members who didn't check
 * in "today" (in their own timezone); if any member's miss_count >= 2,
 * dissolve the hive, persist the reason, and notify members (sec 2.5).
 */
export async function dissolveHivesJob() {
  const activeHives = await db.hive.findMany({
    where: { status: "active" },
    include: { members: { include: { user: true } } },
  });

  let dissolvedCount = 0;

  for (const hive of activeHives) {
    for (const member of hive.members) {
      // "Today" relative to the member's own IANA timezone.
      const todayInTz = new Date(
        new Date().toLocaleString("en-US", { timeZone: member.user.timezone })
      );
      todayInTz.setHours(0, 0, 0, 0);

      const checkedInToday = await db.checkIn.findFirst({
        where: { userId: member.userId, hiveId: hive.id, date: todayInTz },
      });

      if (!checkedInToday) {
        await db.hiveMember.update({
          where: { id: member.id },
          data: { missCount: { increment: 1 } },
        });
      }
    }

    const refreshed = await db.hiveMember.findMany({ where: { hiveId: hive.id } });
    const shouldDissolve = refreshed.some(
      (m: { missCount: number }) => m.missCount >= MISS_THRESHOLD
    );

    if (shouldDissolve) {
      const memberIds = refreshed.map((m: { userId: string }) => m.userId);

      await db.$transaction([
        db.hive.update({
          where: { id: hive.id },
          data: {
            status: "dissolved",
            dissolvedAt: new Date(),
            dissolutionReason: `A member missed ${MISS_THRESHOLD}+ consecutive check-ins.`,
          },
        }),
        db.user.updateMany({
          where: { id: { in: memberIds } },
          data: { currentHiveId: null },
        }),
      ]);

      await redis.publish(
        "hive:events",
        JSON.stringify({
          type: "hive:dissolved",
          hiveId: hive.id,
          reason: "Missed check-in threshold reached.",
        })
      );

      await notifyMany(memberIds, "dissolution", { hiveId: hive.id });

      // Queue rematch for the now-unassigned members.
      await queue.add("rematch", { memberIds, habit: hive.habit });

      dissolvedCount++;
    }
  }

  return { hivesChecked: activeHives.length, dissolved: dissolvedCount };
}