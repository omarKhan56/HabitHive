"use client";

import { Badge } from "@/components/ui";

export interface AdminReport {
  id: string;
  userId: string;
  userName: string;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ReportQueueProps {
  logs: AdminReport[];
}

export function ReportQueue({ logs }: ReportQueueProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-left">
            <th className="px-4 py-3 font-medium text-slate-500">Actor</th>
            <th className="px-4 py-3 font-medium text-slate-500">Action</th>
            <th className="px-4 py-3 font-medium text-slate-500">Metadata</th>
            <th className="px-4 py-3 font-medium text-slate-500">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-800">{log.userName}</p>
                <p className="text-xs text-slate-400">{log.userId.slice(0, 8)}…</p>
              </td>
              <td className="px-4 py-3">
                <Badge variant="info">{log.action}</Badge>
              </td>
              <td className="px-4 py-3 max-w-xs truncate text-slate-500 font-mono text-xs">
                {JSON.stringify(log.metadata)}
              </td>
              <td className="px-4 py-3 text-slate-400">
                {new Date(log.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {logs.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">No audit logs yet.</p>
      )}
    </div>
  );
}