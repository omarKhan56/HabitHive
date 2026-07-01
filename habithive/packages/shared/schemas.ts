import { z } from "zod";

/* ----------------------------- Enums ----------------------------- */

export const HabitEnum = z.enum([
  "gym",
  "wake_up_early",
  "reading",
  "coding",
  "meditation",
]);
export type Habit = z.infer<typeof HabitEnum>;

export const HiveStatusEnum = z.enum(["active", "dissolved"]);
export const UserRoleEnum = z.enum(["user", "admin"]);
export const NotificationTypeEnum = z.enum([
  "reminder",
  "dissolution",
  "rematch",
  "ai_suggestion",
]);
export const AiInsightTypeEnum = z.enum([
  "weekly_summary",
  "suggestion",
  "risk_score",
]);

/* ----------------------------- Auth ----------------------------- */

export const SignupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  habit: HabitEnum,
  timezone: z.string().min(1), // IANA tz, e.g. "Asia/Kolkata"
  language: z.string().min(2).max(10).default("en"),
  preferredCheckinTime: z.string().regex(/^\d{2}:\d{2}$/), // "07:30"
});
export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

/* ----------------------------- Check-ins ----------------------------- */

export const CreateCheckInSchema = z.object({
  hiveId: z.string().uuid(),
  text: z.string().max(2000).optional(),
  photoUrl: z.string().url().optional(),
});
export type CreateCheckInInput = z.infer<typeof CreateCheckInSchema>;

/* ----------------------------- Chat ----------------------------- */

export const SendMessageSchema = z.object({
  hiveId: z.string().uuid(),
  body: z.string().min(1).max(4000),
});
export type SendMessageInput = z.infer<typeof SendMessageSchema>;

/* ----------------------------- AI ----------------------------- */

export const CoachChatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    })
  ),
});
export type CoachChatInput = z.infer<typeof CoachChatSchema>;

/* ----------------------------- Socket events ----------------------------- */

export interface ServerToClientEvents {
  "message:new": (msg: {
    id: string;
    hiveId: string;
    userId: string;
    body: string;
    createdAt: string;
  }) => void;
  "checkin:update": (payload: {
    hiveId: string;
    userId: string;
    date: string;
  }) => void;
  "presence:update": (payload: {
    hiveId: string;
    userId: string;
    online: boolean;
  }) => void;
  "hive:dissolved": (payload: { hiveId: string; reason: string }) => void;
  "notification:new": (payload: {
    id: string;
    type: string;
    payload: unknown;
  }) => void;
}

export interface ClientToServerEvents {
  "message:send": (payload: SendMessageInput) => void;
  "typing:start": (payload: { hiveId: string }) => void;
  "typing:stop": (payload: { hiveId: string }) => void;
}
