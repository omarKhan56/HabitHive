import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { CreateCheckInInput } from "@habithive/shared/schemas";

export async function createCheckIn(userId: string, input: CreateCheckInInput) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Unique constraint on (userId, date) enforces "one check-in per day";
  // this catch turns the Postgres unique violation into a clean app error.
  let checkIn;
  try {
    checkIn = await db.checkIn.create({
      data: {
        userId,
        hiveId: input.hiveId,
        date: today,
        text: input.text,
        photoUrl: input.photoUrl,
      },
    });
  } catch (err: any) {
    if (err.code === "P2002") {
      throw new Error("ALREADY_CHECKED_IN_TODAY");
    }
    throw err;
  }

  // Reset miss_count on successful check-in.
  await db.hiveMember.updateMany({
    where: { hiveId: input.hiveId, userId },
    data: { missCount: 0 },
  });

  // Relay to realtime service via Redis pub/sub -> hive:{hiveId} room.
  await redis.publish(
    "checkin:events",
    JSON.stringify({
      type: "checkin:update",
      hiveId: input.hiveId,
      userId,
      date: today.toISOString(),
    })
  );

  // Invalidate cached analytics for this hive (see analytics.service.ts).
  await redis.del(`analytics:hive:${input.hiveId}:health`);

  return checkIn;
}

export async function getCheckInHistory(userId: string, hiveId: string, limit = 30) {
  return db.checkIn.findMany({
    where: { userId, hiveId },
    orderBy: { date: "desc" },
    take: limit,
  });
}
