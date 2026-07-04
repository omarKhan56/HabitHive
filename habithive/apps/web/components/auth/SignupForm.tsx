"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { signupAction } from "@/app/actions/signup.action";
import { OnboardingWizard, type OnboardingData } from "./OnboardingWizard";
import { Input, Button } from "@/components/ui";

const CredentialsSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});
type CredentialsInput = z.infer<typeof CredentialsSchema>;

type Stage = "credentials" | "onboarding";

export function SignupForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("credentials");
  const [credentials, setCredentials] = useState<CredentialsInput | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CredentialsInput>({ resolver: zodResolver(CredentialsSchema) });

  function onCredentialsSubmit(data: CredentialsInput) {
    setCredentials(data);
    setStage("onboarding");
  }

  async function onOnboardingComplete(onboarding: OnboardingData) {
    if (!credentials) return;
    setSubmitting(true);
    setServerError(null);

    const formData = new FormData();
    formData.set("name", credentials.name);
    formData.set("email", credentials.email);
    formData.set("password", credentials.password);
    formData.set("habit", onboarding.habit);
    formData.set("timezone", onboarding.timezone);
    formData.set("language", onboarding.language);
    formData.set("preferredCheckinTime", onboarding.preferredCheckinTime);

    // Step 1: Create account + run matching
    const result = await signupAction(formData);

    if (!result.ok) {
      const message =
        typeof result.error === "string"
          ? result.error
          : "Please check your details and try again.";
      setServerError(message);
      setSubmitting(false);
      setStage("credentials");
      return;
    }

    // Step 2: Sign in
    const signInResult = await signIn("credentials", {
      email: credentials.email,
      password: credentials.password,
      redirect: false,
    });

    setSubmitting(false);

    if (signInResult?.error) {
      router.push("/login");
      return;
    }

    // Step 3: Navigate to dashboard
    // Use window.location.href instead of router.push so the entire page
    // reloads fresh — this clears any stale React Query cache and forces
    // GET /api/hives to run with the newly created session.
    window.location.href = "/dashboard";
  }

  if (stage === "onboarding") {
    return (
      <OnboardingWizard
        submitting={submitting}
        onBack={() => setStage("credentials")}
        onComplete={onOnboardingComplete}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onCredentialsSubmit)}
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <Input label="Name" {...register("name")} error={errors.name?.message} />

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        {...register("email")}
        error={errors.email?.message}
      />

      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        {...register("password")}
        error={errors.password?.message}
      />

      {serverError && <p className="text-sm text-red-500">{serverError}</p>}

      <Button type="submit" className="w-full">
        Continue
      </Button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <a href="/login" className="font-medium text-amber-600 hover:underline">
          Sign in
        </a>
      </p>
    </form>
  );
}