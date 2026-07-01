/**
 * AI Service (LLM Integration) — section 2.4 of the architecture doc.
 *
 * ORIGINAL: OpenAI API
 * NOW:      Groq API (OpenAI-compatible, drop-in swap)
 *
 * We use the Vercel AI SDK's official Groq provider (@ai-sdk/groq), so
 * streaming, the `useChat` hook on the frontend (sec 1.6), and the rest of
 * the app's plumbing are unaffected — only the provider + model changed.
 *
 * Get a key: https://console.groq.com/keys
 * Docs:      https://console.groq.com/docs/openai
 */
import { groq } from "@ai-sdk/groq";
import { streamText, generateText } from "ai";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { getUserCompletionRate, getUserStreak, computeRiskScore } from "./analytics.service";

// Fast + capable model on Groq's LPU inference; swap freely.
// Good defaults: "llama-3.3-70b-versatile" (quality) or "llama-3.1-8b-instant" (speed/cost).
const MODEL_ID = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

const COACH_DAILY_CAP = 30; // per-user daily cap on coach messages (cost control, sec 2.4)

/* --------------------------- Rate limiting / cost control --------------------------- */

async function assertWithinDailyCap(userId: string) {
  const key = `ai:coach:cap:${userId}:${new Date().toISOString().slice(0, 10)}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60 * 60 * 24);
  if (count > COACH_DAILY_CAP) {
    throw new Error("DAILY_AI_LIMIT_REACHED");
  }
}

/* --------------------------- Coach Chat (streaming) --------------------------- */

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Builds the system prompt from the user's recent check-in history + hive
 * context, then streams a chat completion from Groq.
 * Called from app/api/ai/coach/route.ts via the Vercel AI SDK's useChat hook.
 */
export async function streamCoachChat(userId: string, messages: ChatMessage[]) {
  await assertWithinDailyCap(userId);

  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    include: { currentHive: true },
  });

  const recentCheckIns = await db.checkIn.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 7,
  });

  const completionRate = await getUserCompletionRate(userId);
  const streak = user.currentHiveId
    ? await getUserStreak(userId, user.currentHiveId)
    : 0;

  const systemPrompt = `You are the HabitHive AI Coach — a warm, concise accountability coach.

User's habit: ${user.habit}
Current streak: ${streak} day(s)
7-day completion rate: ${Math.round(completionRate * 100)}%
Recent check-ins: ${recentCheckIns
    .map((c: { date: Date; text: string | null }) =>
      `${c.date.toISOString().slice(0, 10)}${c.text ? `: ${c.text}` : ""}`
    )
    .join("; ") || "none yet"}
Hive status: ${user.currentHiveId ? "in an active hive" : "not currently in a hive"}

Be encouraging but honest. Keep responses short (2-4 sentences) unless asked
for detail. Never invent check-in data that wasn't given to you above.`;

  const result = streamText({
    model: groq(MODEL_ID),
    system: systemPrompt,
    messages,
    temperature: 0.6,
  });

  return result; // route handler turns this into a streaming Response
}

/* --------------------------- Weekly Summary --------------------------- */

/**
 * Pulls 7 days of check-in/analytics data for a user, prompts Groq for a
 * concise summary + one suggestion, stores it in ai_insights.
 * Called from the scheduled worker job (apps/worker/jobs/weeklySummary.job.ts)
 * and on-demand from app/api/ai/weekly-summary/route.ts.
 */
export async function generateWeeklySummary(userId: string) {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const [user, checkIns, completionRate] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId } }),
    db.checkIn.findMany({ where: { userId, date: { gte: since } }, orderBy: { date: "asc" } }),
    getUserCompletionRate(userId, 7),
  ]);

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

  const { text } = await generateText({
    model: groq(MODEL_ID),
    prompt,
    temperature: 0.5,
  });

  const insight = await db.aiInsight.create({
    data: {
      userId,
      type: "weekly_summary",
      content: text,
    },
  });

  return insight;
}

/* --------------------------- Risk-based Suggestion --------------------------- */

/**
 * Risk Prediction (sec 2.4): the risk SCORE itself stays deterministic and
 * explainable (rule-based, computed in analytics.service.ts). Groq is used
 * ONLY to phrase the human-readable suggestion based on that score —
 * the prediction logic is never delegated to the LLM.
 */
export async function generateRiskSuggestion(userId: string, hiveId: string) {
  const riskScore = await computeRiskScore(userId, hiveId);

  if (riskScore < 0.4) {
    return null; // not at risk enough to warrant a proactive nudge
  }

  const member = await db.hiveMember.findFirst({ where: { userId, hiveId } });
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });

  const prompt = `A user is at risk of falling off their habit streak.
Habit: ${user.habit}
Consecutive misses: ${member?.missCount ?? 0}
Computed risk score (0-1, higher = more at risk): ${riskScore.toFixed(2)}
Preferred check-in time: ${user.preferredCheckinTime}

Write ONE short, specific, encouraging suggestion (max 20 words) to help them
get back on track. Example style: "Try moving your check-in 30 minutes
earlier — mornings have been your best window this week."`;

  const { text } = await generateText({
    model: groq(MODEL_ID),
    prompt,
    temperature: 0.7,
    maxTokens: 60,
  });

  const insight = await db.aiInsight.create({
    data: {
      userId,
      type: "suggestion",
      content: text.trim(),
      riskScore,
    },
  });

  return insight;
}