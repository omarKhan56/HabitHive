/**
 * Thin re-export layer so client components import from "@/lib/validators"
 * instead of reaching into the shared package directly — keeps a single
 * place to add UI-only constants (labels, options) alongside the schemas
 * that are actually shared with the backend.
 */
export {
  SignupSchema,
  LoginSchema,
  CreateCheckInSchema,
  SendMessageSchema,
  CoachChatSchema,
  HabitEnum,
} from "@habithive/shared/schemas";

export type {
  SignupInput,
  LoginInput,
  CreateCheckInInput,
  SendMessageInput,
  CoachChatInput,
  Habit,
} from "@habithive/shared/schemas";

/** Display labels for the Habit enum — used by HabitSelect / OnboardingWizard. */
export const HABIT_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: "gym", label: "Gym", emoji: "🏋️" },
  { value: "wake_up_early", label: "Wake Up Early", emoji: "🌅" },
  { value: "reading", label: "Reading", emoji: "📚" },
  { value: "coding", label: "Coding", emoji: "💻" },
  { value: "meditation", label: "Meditation", emoji: "🧘" },
];

/** A short, common-sense IANA timezone list. Falls back to the browser's own. */
export const COMMON_TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney",
];

export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
];
