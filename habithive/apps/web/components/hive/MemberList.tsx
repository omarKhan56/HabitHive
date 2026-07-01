"use client";
 
import { AlertTriangle } from "lucide-react";
import { Avatar } from "@/components/ui";
import { StreakBadge } from "./StreakBadge";
import type { HiveMemberDTO } from "@/lib/api-client";
 
export interface MemberListProps {
  members: HiveMemberDTO[];
  /** Optional: userId -> live streak count, computed server-side via analytics.service. */
  streaks?: Record<string, number>;
  /** Optional: userId -> online/offline, fed by the realtime presence channel. */
  presence?: Record<string, boolean>;
  currentUserId?: string;
}
 
/**
 * Renders each HiveMember (sec 2.3 hive_members table): name, avatar,
 * presence dot, miss-count warning (precursor to dissolution), and streak.
 */
export function MemberList({ members, streaks = {}, presence = {}, currentUserId }: MemberListProps) {
  return (
    <ul className="flex flex-col divide-y divide-slate-100">
      {members.map((m) => (
        <li key={m.user.id} className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <Avatar name={m.user.name} online={presence[m.user.id]} />
            <div>
              <p className="text-sm font-medium text-slate-800">
                {m.user.name}
                {m.user.id === currentUserId && (
                  <span className="ml-1.5 text-xs font-normal text-slate-400">(you)</span>
                )}
              </p>
              {m.missCount > 0 && (
                <p className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  {m.missCount} missed check-in{m.missCount === 1 ? "" : "s"}
                </p>
              )}
            </div>
          </div>
 
          <StreakBadge streak={streaks[m.user.id] ?? 0} />
        </li>
      ))}
    </ul>
  );
}