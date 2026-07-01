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

/** Redis-backed rate limiter for login attempts, keyed by email (sec 2.4 / 2.8). */
export async function checkLoginRateLimit(email: string): Promise<boolean> {
  const key = `ratelimit:login:${email}`;
  const attempts = await redis.incr(key);
  if (attempts === 1) {
    await redis.expire(key, LOGIN_RATE_LIMIT_WINDOW_SECONDS);
  }
  return attempts <= LOGIN_RATE_LIMIT_MAX_ATTEMPTS;
}

/**
 * Creates the user record, then enqueues them into the matching pool.
 * The actual hive-formation run happens async (Matching Service / worker),
 * so this returns quickly.
 */
export async function signupUser(input: SignupInput) {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error("EMAIL_TAKEN");
  }

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

  // Push onto the waiting pool (a simple Redis set per habit); the Matching
  // Service / worker consumes this to attempt hive formation.
  await redis.sadd(`matching:pool:${input.habit}`, user.id);

  // Attempt to form a hive immediately — the pool just changed, which is
  // exactly the trigger condition described for the Matching Service
  // (sec 2.4). If there still aren't enough compatible users, this is a
  // no-op and the user simply waits in the pool for the next signup.
  await runMatchingForHabit(input.habit).catch((err) => {
    // Never let a matching hiccup fail the signup itself.
    console.error("[auth.service] matching attempt failed after signup", err);
  });

  return user;
}