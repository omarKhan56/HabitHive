import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-800">🐝 HabitHive</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back — let&#x2019;s check in.</p>
      </div>
      <LoginForm />
    </main>
  );
}
