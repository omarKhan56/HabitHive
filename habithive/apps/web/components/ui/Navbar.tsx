"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  CheckSquare,
  BarChart2,
  Bot,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { Avatar, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/checkin", label: "Check In", icon: CheckSquare },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/coach", label: "AI Coach", icon: Bot },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-slate-800"
        >
          <span className="text-xl">🐝</span>
          <span className="hidden sm:inline">HabitHive</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-amber-50 text-amber-600"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="flex items-center gap-3">
          {user?.name && <Avatar name={user.name} size="sm" />}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="hidden sm:flex"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="flex items-center justify-around border-t border-slate-100 bg-white pb-safe md:hidden">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "text-amber-600"
                : "text-slate-400"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}