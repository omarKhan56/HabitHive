import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { SignupInput } from "@habithive/shared/schemas";
import { runMatchingForHabit } from "./matching.service";

const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function checkLoginRateLimit(email: string): Promise<boolean> {
  const key = `ratelimit:login:${email}`;
  const attempts = await redis.incr(key);
  if (attempts === 1) {
    await redis.expire(key, LOGIN_RATE_LIMIT_WINDOW_SECONDS);
  }
  return attempts <= LOGIN_RATE_LIMIT_MAX_ATTEMPTS;
}

export async function signupUser(input: SignupInput) {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("EMAIL_TAKEN");

  const passwordHash = await hashPassword(input.password);

  const user = await db.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      habit: input.habit,
      timezone: input.timezone,
      language: input.language,
      preferredCheckinTime: input.preferredCheckinTime,
    },
  });

  console.log(`[matching] adding user ${user.id} to pool: matching:pool:${input.habit}`);
  const poolSize = await redis.sadd(`matching:pool:${input.habit}`, user.id);
  const currentPool = await redis.smembers(`matching:pool:${input.habit}`);
  console.log(`[matching] pool size: ${currentPool.length}, members: ${currentPool}`);

  try {
    console.log(`[matching] running matching for habit: ${input.habit}`);
    const result = await runMatchingForHabit(input.habit);
    console.log(`[matching] result: ${result.formed} hive(s) formed`);
  } catch (err) {
    console.error("[matching] runMatchingForHabit failed:", err);
  }

  return user;
}