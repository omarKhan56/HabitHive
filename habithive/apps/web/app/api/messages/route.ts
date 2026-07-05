import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const userId = (session.user as any).id as string;
  const hiveId = new URL(req.url).searchParams.get("hiveId");

  if (!hiveId) {
    return new Response("hiveId query param required", { status: 400 });
  }

  // Verify the requesting user is actually a member of this hive
  const membership = await db.hiveMember.findFirst({
    where: { hiveId, userId },
  });

  if (!membership) {
    return new Response("Forbidden", { status: 403 });
  }

  const messages = await db.message.findMany({
    where: { hiveId },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: {
      id: true,
      hiveId: true,
      userId: true,
      body: true,
      createdAt: true,
    },
  });

  // Serialize dates to strings
  return Response.json(
    messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    }))
  );
}