"use client";
 
import { useSession } from "next-auth/react";
import { Users2 } from "lucide-react";
import { useHive } from "@/hooks/useHive";
import { HiveCard } from "@/components/hive/HiveCard";
import { DissolutionBanner } from "@/components/hive/DissolutionBanner";
import { Spinner, EmptyState } from "@/components/ui";
 
export default function DashboardPage() {
  const { data: session } = useSession();
  const { hive, health, isLoading, isError } = useHive();
 
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-800">
        Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""} 👋
      </h1>
      <p className="mt-1 text-sm text-slate-500">Here&#x2019;s where your hive stands today.</p>
 
      <div className="mt-6 flex flex-col gap-4">
        {isLoading && <Spinner label="Loading your hive…" className="mt-12" />}
 
        {isError && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            Couldn&#x2019;t load your hive. Please refresh the page.
          </p>
        )}
 
        {!isLoading && !isError && !hive && (
          <EmptyState
            icon={Users2}
            title="You're not in a hive yet"
            description="We're matching you with up to 4 other people building the same habit. This usually happens within a day."
            className="rounded-xl border border-slate-200 bg-white"
          />
        )}
 
        {!isLoading && hive && hive.status === "dissolved" && (
          <DissolutionBanner hiveId={hive.id} />
        )}
 
        {!isLoading && hive && hive.status === "active" && (
          <HiveCard hive={hive} health={health} />
        )}
      </div>
    </main>
  );
}