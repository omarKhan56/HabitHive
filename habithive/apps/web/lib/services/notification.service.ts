import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NotificationTypeEnum } from "@habithive/shared/schemas";
import { z } from "zod";

type NotificationType = z.infer<typeof NotificationTypeEnum>;

/**
 * In-app notification, always written to Postgres.
 * Push (FCM) and email (Resend) are fire-and-forget side channels — failures
 * there should never block the in-app notification from being recorded.
 */
export async function notifyUser(
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown>
) {
  const notification = await db.notification.create({
    data: { userId, type, payload: payload as Prisma.InputJsonValue },
  });

  await Promise.allSettled([sendPush(userId, type, payload), sendEmail(userId, type, payload)]);

  return notification;
}

async function sendPush(userId: string, type: NotificationType, payload: Record<string, unknown>) {
  // Firebase Cloud Messaging integration point.
  // const token = await getFcmTokenForUser(userId);
  // if (!token) return;
  // await admin.messaging().send({ token, notification: { title: titleFor(type), body: bodyFor(type, payload) } });
  if (process.env.NODE_ENV === "development") {
    console.log(`[push:dev] -> user ${userId}`, type, payload);
  }
}

async function sendEmail(userId: string, type: NotificationType, payload: Record<string, unknown>) {
  // Resend / SES integration point.
  // const user = await db.user.findUnique({ where: { id: userId } });
  // await resend.emails.send({ to: user.email, subject: titleFor(type), html: renderEmail(type, payload) });
  if (process.env.NODE_ENV === "development") {
    console.log(`[email:dev] -> user ${userId}`, type, payload);
  }
}

export async function notifyMany(
  userIds: string[],
  type: NotificationType,
  payload: Record<string, unknown>
) {
  await Promise.all(userIds.map((id) => notifyUser(id, type, payload)));
}