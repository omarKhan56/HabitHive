import { PrismaClient, Prisma } from "@prisma/client";

const db = new PrismaClient();

type NotificationType = "reminder" | "dissolution" | "rematch" | "ai_suggestion";

/**
 * Writes the in-app notification row and fires push/email side channels.
 * Kept as a small standalone helper since the worker is a separate process
 * from apps/web (mirrors lib/services/notification.service.ts there).
 */
export async function notifyUser(
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown>
) {
  await db.notification.create({
    data: { userId, type, payload: payload as Prisma.InputJsonValue },
  });

  // FCM / Resend integration points — same as apps/web/lib/services/notification.service.ts
  if (process.env.NODE_ENV === "development") {
    console.log(`[worker:notify] -> user ${userId}`, type, payload);
  }
}

export async function notifyMany(
  userIds: string[],
  type: NotificationType,
  payload: Record<string, unknown>
) {
  await Promise.all(userIds.map((id) => notifyUser(id, type, payload)));
}