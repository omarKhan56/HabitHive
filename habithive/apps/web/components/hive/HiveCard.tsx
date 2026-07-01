"use client";
 
import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Badge, Avatar, Button } from "@/components/ui";
import type { HiveDTO, HiveHealthDTO } from "@/lib/api-client";
 
export interface HiveCardProps {
  hive: HiveDTO;
  health?: HiveHealthDTO;
}
 
const HABIT_LABELS: Record<string, string> = {
  gym: "Gym",
  wake_up_early: "Wake Up Early",
  reading: "Reading",
  coding: "Coding",
  meditation: "Meditation",
};
 
function healthColor(score: number) {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}
 
/** Compact hive summary shown on the dashboard (sec 1.5). Links to the full hive page. */
export function HiveCard({ hive, health }: HiveCardProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{HABIT_LABELS[hive.habit] ?? hive.habit}</CardTitle>
          <p className="mt-0.5 text-xs text-slate-400">
            Formed {new Date(hive.startedAt).toLocaleDateString()} &middot; Compatibility{" "}
            {hive.compatibilityScore}%
          </p>
        </div>
        <Badge variant={hive.status === "active" ? "success" : "danger"}>{hive.status}</Badge>
      </CardHeader>
 
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-400" />
          <div className="flex -space-x-2">
            {hive.members.slice(0, 5).map((m) => (
              <Avatar key={m.user.id} name={m.user.name} size="sm" className="ring-2 ring-white" />
            ))}
          </div>
          <span className="text-xs text-slate-500">{hive.members.length} members</span>
        </div>
 
        {health && (
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-slate-500">Hive health</span>
              <span className={healthColor(health.score)}>{health.score}/100</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  health.score >= 70
                    ? "bg-emerald-500"
                    : health.score >= 40
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${health.score}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
 
      <CardFooter className="justify-end">
        <Link href={`/hive/${hive.id}`}>
          <Button size="sm" variant="outline">
            View hive <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}