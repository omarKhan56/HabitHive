"use server";

import { signupUser } from "@/lib/services/auth.service";
import { SignupSchema } from "@habithive/shared/schemas";

export async function signupAction(formData: FormData) {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    habit: formData.get("habit"),
    timezone: formData.get("timezone"),
    language: formData.get("language") ?? "en",
    preferredCheckinTime: formData.get("preferredCheckinTime"),
  };

  const parsed = SignupSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten() };
  }

  try {
    const user = await signupUser(parsed.data);
    return { ok: true as const, userId: user.id };
  } catch (err: any) {
    if (err.message === "EMAIL_TAKEN") {
      return { ok: false as const, error: "An account with this email already exists." };
    }
    throw err;
  }
}
