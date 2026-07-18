import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

const MODEL_ID = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

/**
 * Generates a short motivational motto for a hive based on their habit
 * and performance. Used in the shareable hive card.
 */
export async function generateHiveMotto(
  habit: string,
  completionRate: number,
  daysSinceStart: number,
  memberNames: string[]
): Promise<string> {
  const { text } = await generateText({
    model: groq(MODEL_ID),
    prompt: `Generate ONE short motivational motto (max 8 words) for a group of 
${memberNames.length} people who have been building a ${habit} habit together 
for ${daysSinceStart} days with a ${completionRate}% completion rate.

Requirements:
- Max 8 words
- Inspiring and specific to the habit
- No quotes, no attribution, just the motto text
- Examples: "Small steps build unbreakable habits", "Consistency is our superpower"

Return ONLY the motto text, nothing else.`,
    temperature: 0.8,
    maxTokens: 30,
  });

  return text.trim().replace(/^["']|["']$/g, "");
}