"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoginSchema, type LoginInput } from "@/lib/validators";
import { Input, Button } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setServerError(null);

    const result = await signIn("credentials", {
      ...data,
      redirect: false,
    });

    if (result?.error) {
      if (result.error === "TOO_MANY_ATTEMPTS") {
        setServerError("Too many login attempts. Please wait a while and try again.");
      } else {
        setServerError("Invalid email or password.");
      }
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-sm flex-col gap-4">
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
        autoComplete="current-password"
        {...register("password")}
        error={errors.password?.message}
      />

      {serverError && <p className="text-sm text-red-500">{serverError}</p>}

      <Button type="submit" loading={isSubmitting} className="w-full">
        {isSubmitting ? "Signing in…" : "Sign In"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Don&#x2019;t have an account?{" "}
        <a href="/signup" className="font-medium text-amber-600 hover:underline">
          Sign up
        </a>
      </p>
    </form>
  );
}