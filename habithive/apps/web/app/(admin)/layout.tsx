import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

/**
 * Minimal layout for the admin panel — separate from the dashboard layout
 * intentionally, since admins need a distinct visual context and the
 * middleware already gates this route group by role (sec 1.4).
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-600" />
            <span className="font-semibold text-slate-800">HabitHive Admin</span>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to app
          </Link>
        </div>
      </header>
      <div>{children}</div>
    </div>
  );
}