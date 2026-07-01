import { PrismaClient } from "@prisma/client";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { notifyUser } from "./_shared/notify";

const db = new PrismaClient();
const MODEL_ID = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

/**
 * For each active user, generates the AI weekly summary + suggestion via
 * Groq (was OpenAI), stores it in ai_insights, and notifies the user (sec 2.5).
 * Mirrors apps/web/lib/services/ai.service.ts#generateWeeklySummary, kept
 * standalone here since the worker is deployed as its own process.
 */
export async function weeklySummaryJob() {
  const users = await db.user.findMany({ where: { currentHiveId: { not: null } } });

  let generated = 0;

  for (const user of users) {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const checkIns = await db.checkIn.findMany({
      where: { userId: user.id, date: { gte: since } },
      orderBy: { date: "asc" },
    });

    const completionRate = checkIns.length / 7;

    const prompt = `Habit: ${user.habit}
Check-ins this week (${checkIns.length}/7 days): ${
      checkIns
        .map((c: { text: string | null }) => c.text || "(no note)")
        .join(" | ") || "no check-ins this week"
    }
Completion rate: ${Math.round(completionRate * 100)}%

Write a friendly 2-3 sentence weekly summary for this user, then exactly one
concrete, specific suggestion for next week. Format as:
Summary: <text>
Suggestion: <text>`;

    try {
      const { text } = await generateText({
        model: groq(MODEL_ID),
        prompt,
        temperature: 0.5,
      });

      await db.aiInsight.create({
        data: { userId: user.id, type: "weekly_summary", content: text },
      });

      await notifyUser(user.id, "ai_suggestion", { kind: "weekly_summary" });
      generated++;
    } catch (err) {
      console.error(`[weeklySummary] failed for user ${user.id}`, err);
    }
  }

  return { usersProcessed: users.length, generated };
}