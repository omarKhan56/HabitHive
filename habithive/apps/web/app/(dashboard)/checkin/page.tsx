"use client";
 
import { useHive } from "@/hooks/useHive";
import { CheckInForm } from "@/components/checkin/CheckInForm";
import { CheckInHistory } from "@/components/checkin/CheckInHistory";
import { Card, CardHeader, CardTitle, CardContent, Spinner, EmptyState } from "@/components/ui";
import { Users2 } from "lucide-react";
 
export default function CheckInPage() {
  const { hive, isLoading, isError } = useHive();
 
  if (isLoading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <Spinner label="Loading…" />
      </main>
    );
  }
 
  if (isError) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Couldn&#x2019;t load your hive.
        </p>
      </main>
    );
  }
 
  if (!hive || hive.status !== "active") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <EmptyState
          icon={Users2}
          title="No active hive"
          description="You need to be in an active hive before you can check in."
          className="rounded-xl border border-slate-200 bg-white"
        />
      </main>
    );
  }
 
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-800">Today&#x2019;s check-in</h1>
      <p className="mt-1 text-sm text-slate-500">
        Let your hive know how it went — a note and photo are both optional.
      </p>
 
      <Card className="mt-6">
        <CardContent>
          <CheckInForm hiveId={hive.id} />
        </CardContent>
      </Card>
 
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckInHistory hiveId={hive.id} />
        </CardContent>
      </Card>
    </main>
  );
}