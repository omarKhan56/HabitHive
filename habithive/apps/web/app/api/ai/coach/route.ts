import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { streamCoachChat } from "@/lib/services/ai.service";
import { CoachChatSchema } from "@habithive/shared/schemas";

export const runtime = "nodejs"; // Groq calls happen server-side only — never from the client

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const parsed = CoachChatSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify(parsed.error.flatten()), { status: 400 });
  }

  try {
    const result = await streamCoachChat(
      (session.user as any).id,
      parsed.data.messages
    );
    return result.toDataStreamResponse(); // consumed by useChat() on the client
  } catch (err: any) {
    if (err.message === "DAILY_AI_LIMIT_REACHED") {
      return new Response("Daily AI coach limit reached. Try again tomorrow.", {
        status: 429,
      });
    }
    console.error("[ai/coach] error", err);
    return new Response("AI coach is temporarily unavailable.", { status: 502 });
  }
}
