"use client";

import { Badge } from "@/components/ui";

export interface AdminHive {
  id: string;
  habit: string;
  status: "active" | "dissolved";
  compatibilityScore: number;
  memberCount: number;
  startedAt: string;
  dissolvedAt: string | null;
  dissolutionReason: string | null;
}

export interface HiveMonitorProps {
  hives: AdminHive[];
}

const HABIT_LABELS: Record<string, string> = {
  gym: "Gym",
  wake_up_early: "Wake Up Early",
  reading: "Reading",
  coding: "Coding",
  meditation: "Meditation",
};

export function HiveMonitor({ hives }: HiveMonitorProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-left">
            <th className="px-4 py-3 font-medium text-slate-500">Habit</th>
            <th className="px-4 py-3 font-medium text-slate-500">Status</th>
            <th className="px-4 py-3 font-medium text-slate-500">Members</th>
            <th className="px-4 py-3 font-medium text-slate-500">Compatibility</th>
            <th className="px-4 py-3 font-medium text-slate-500">Started</th>
            <th className="px-4 py-3 font-medium text-slate-500">Dissolved</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {hives.map((h) => (
            <tr key={h.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-800">
                {HABIT_LABELS[h.habit] ?? h.habit}
              </td>
              <td className="px-4 py-3">
                <Badge variant={h.status === "active" ? "success" : "danger"}>
                  {h.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-slate-600">{h.memberCount}</td>
              <td className="px-4 py-3 text-slate-600">{h.compatibilityScore}%</td>
              <td className="px-4 py-3 text-slate-400">
                {new Date(h.startedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td className="px-4 py-3 text-slate-400">
                {h.dissolvedAt
                  ? new Date(h.dissolvedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {hives.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">No hives yet.</p>
      )}
    </div>
  );
}