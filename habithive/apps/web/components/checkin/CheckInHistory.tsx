"use client";
 
import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { Spinner, EmptyState } from "@/components/ui";
import { useCheckIns } from "@/hooks/useCheckIns";
 
export interface CheckInHistoryProps {
  hiveId: string;
}
 
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
 
export function CheckInHistory({ hiveId }: CheckInHistoryProps) {
  const { history, isLoading, isError } = useCheckIns(hiveId);
 
  if (isLoading) return <Spinner label="Loading history…" className="py-8" />;
 
  if (isError) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
        Couldn&#x2019;t load your check-in history.
      </p>
    );
  }
 
  if (history.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No check-ins yet"
        description="Your first check-in will show up here."
      />
    );
  }
 
  return (
    <ul className="flex flex-col divide-y divide-slate-100">
      {history.map((c) => (
        <li key={c.id} className="flex items-start gap-3 py-3">
          {c.photoUrl ? (
            <Image
              src={c.photoUrl}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-slate-100">
              <CalendarDays className="h-5 w-5 text-slate-400" />
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-slate-500">{formatDate(c.date)}</p>
            {c.text && <p className="mt-0.5 text-sm text-slate-700">{c.text}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}