"use client";

import { Avatar, Badge } from "@/components/ui";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  habit: string;
  currentHiveId: string | null;
  createdAt: string;
}

export interface UserTableProps {
  users: AdminUser[];
}

const HABIT_LABELS: Record<string, string> = {
  gym: "Gym",
  wake_up_early: "Wake Up Early",
  reading: "Reading",
  coding: "Coding",
  meditation: "Meditation",
};

export function UserTable({ users }: UserTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-left">
            <th className="px-4 py-3 font-medium text-slate-500">User</th>
            <th className="px-4 py-3 font-medium text-slate-500">Habit</th>
            <th className="px-4 py-3 font-medium text-slate-500">Role</th>
            <th className="px-4 py-3 font-medium text-slate-500">Hive</th>
            <th className="px-4 py-3 font-medium text-slate-500">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={u.name} size="sm" />
                  <div>
                    <p className="font-medium text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">
                {HABIT_LABELS[u.habit] ?? u.habit}
              </td>
              <td className="px-4 py-3">
                <Badge variant={u.role === "admin" ? "warning" : "default"}>
                  {u.role}
                </Badge>
              </td>
              <td className="px-4 py-3">
                {u.currentHiveId ? (
                  <Badge variant="success">In hive</Badge>
                ) : (
                  <Badge variant="default">Waiting</Badge>
                )}
              </td>
              <td className="px-4 py-3 text-slate-400">
                {new Date(u.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">No users found.</p>
      )}
    </div>
  );
}