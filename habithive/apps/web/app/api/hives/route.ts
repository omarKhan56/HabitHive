import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getHiveHealthScore } from "@/lib/services/analytics.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const userId = (session.user as any).id;

  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      currentHive: {
        include: {
          members: { include: { user: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  if (!user.currentHive) {
    return Response.json({ hive: null });
  }

  const health = await getHiveHealthScore(user.currentHive.id);

  return Response.json({ hive: user.currentHive, health });
}
