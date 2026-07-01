import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateWeeklySummary } from "@/lib/services/ai.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = (session.user as any).id;

  // Avoid duplicate Groq calls: serve the most recent summary if it's from
  // within the last 7 days (sec 2.4 cost control).
  const recent = await db.aiInsight.findFirst({
    where: { userId, type: "weekly_summary" },
    orderBy: { createdAt: "desc" },
  });

  const isFresh =
    recent && Date.now() - recent.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000;

  if (isFresh) {
    return Response.json(recent);
  }

  const insight = await generateWeeklySummary(userId);
  return Response.json(insight);
}
