import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/** GET: fetch unread notifications for the current user (used by the chat page header badge). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const userId = (session.user as any).id as string;

  const notifications = await db.notification.findMany({
    where: { userId, read: false },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return Response.json(notifications);
}

/** PATCH: mark all notifications as read. */
export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const userId = (session.user as any).id as string;

  await db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return new Response(null, { status: 204 });
}