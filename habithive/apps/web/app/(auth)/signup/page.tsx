import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-800">🐝 HabitHive</h1>
        <p className="mt-1 text-sm text-slate-500">
          Find your hive. Build the habit together.
        </p>
      </div>
      <SignupForm />
    </main>
  );
}
