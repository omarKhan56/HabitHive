import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runMatchingForHabit } from "@/lib/services/matching.service";
import { redis } from "@/lib/redis";
import { Habit } from "@prisma/client";

/**
 * Dev/admin endpoint to manually trigger the matching algorithm.
 * GET /api/matching/trigger?habit=gym
 * Also returns the current pool contents so you can debug the full state.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const habit = new URL(req.url).searchParams.get("habit") as Habit | null;
  if (!habit) {
    return new Response("habit query param required (gym|wake_up_early|reading|coding|meditation)", { status: 400 });
  }

  // Show pool state before matching
  const poolBefore = await redis.smembers(`matching:pool:${habit}`);

  // Run matching
  const result = await runMatchingForHabit(habit);

  // Show pool state after matching
  const poolAfter = await redis.smembers(`matching:pool:${habit}`);

  return Response.json({
    habit,
    poolBefore,
    poolAfter,
    hivesFormed: result.formed,
  });
}