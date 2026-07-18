"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { MessageCircle } from "lucide-react";
import { useHive } from "@/hooks/useHive";
import { MemberList } from "@/components/hive/MemberList";
import { DissolutionBanner } from "@/components/hive/DissolutionBanner";
import { ShareHiveButton } from "@/components/hive/ShareHiveButton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Spinner,
  Button,
} from "@/components/ui";

const HABIT_LABELS: Record<string, string> = {
  gym: "Gym",
  wake_up_early: "Wake Up Early",
  reading: "Reading",
  coding: "Coding",
  meditation: "Meditation",
};

export default function HivePage() {
  const { data: session } = useSession();
  const { hive, health, isLoading, isError } = useHive();
  const currentUserId = (session?.user as any)?.id as string | undefined;

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Spinner label="Loading hive…" />
      </main>
    );
  }

  if (isError || !hive) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Couldn&#x2019;t load this hive.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {hive.status === "dissolved" && (
        <div className="mb-4">
          <DissolutionBanner hiveId={hive.id} />
        </div>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base">
              {HABIT_LABELS[hive.habit] ?? hive.habit} Hive
            </CardTitle>
            <p className="mt-0.5 text-xs text-slate-400">
              {hive.members.length} members &middot; Compatibility{" "}
              {hive.compatibilityScore}%
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={hive.status === "active" ? "success" : "danger"}>
              {hive.status}
            </Badge>
            {hive.status === "active" && (
              <ShareHiveButton hiveId={hive.id} />
            )}
          </div>
        </CardHeader>

        <CardContent>
          {health?.breakdown && (
            <div className="mb-5 grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3 text-center">
              <div>
                <p className="text-lg font-semibold text-slate-800">
                  {Math.round(health.breakdown.completionRate * 100)}%
                </p>
                <p className="text-xs text-slate-400">Completion</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-800">
                  {Math.round(health.breakdown.missHealth * 100)}%
                </p>
                <p className="text-xs text-slate-400">Consistency</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-800">
                  {Math.round(health.breakdown.engagement * 100)}%
                </p>
                <p className="text-xs text-slate-400">Engagement</p>
              </div>
            </div>
          )}

          <MemberList members={hive.members} currentUserId={currentUserId} />
        </CardContent>
      </Card>

      {hive.status === "active" && (
        <Link href={`/hive/${hive.id}/chat`} className="mt-4 block">
          <Button className="w-full">
            <MessageCircle className="h-4 w-4" />
            Open hive chat
          </Button>
        </Link>
      )}
    </main>
  );
}