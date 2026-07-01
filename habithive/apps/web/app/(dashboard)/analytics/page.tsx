"use client";

import { BarChart2 } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { CompletionChart } from "@/components/analytics/CompletionChart";
import { HiveHealthGauge } from "@/components/analytics/HiveHealthGauge";
import { Card, CardHeader, CardTitle, CardContent, Spinner, EmptyState } from "@/components/ui";

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useAnalytics();

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Spinner label="Loading analytics…" />
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Couldn&#x2019;t load analytics. Please try again.
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          icon={BarChart2}
          title="No analytics yet"
          description="Join a hive and start checking in — your stats will appear here."
          className="rounded-xl border border-slate-200 bg-white"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-800">Analytics</h1>
      <p className="mt-1 text-sm text-slate-500">
        Your progress over the last 14 days.
      </p>

      {/* Stat tiles */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{data.streak}</p>
            <p className="text-xs text-slate-400">Day streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-slate-800">
              {Math.round(data.completionRate * 100)}%
            </p>
            <p className="text-xs text-slate-400">14-day rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{data.totalCheckIns}</p>
            <p className="text-xs text-slate-400">Total check-ins</p>
          </CardContent>
        </Card>
      </div>

      {/* Completion chart */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Check-in history</CardTitle>
        </CardHeader>
        <CardContent>
          <CompletionChart checkInDates={data.checkInDates} />
        </CardContent>
      </Card>

      {/* Hive health */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Hive health</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-2">
          <HiveHealthGauge
            score={data.hiveHealthScore}
            breakdown={data.hiveHealthBreakdown}
          />
        </CardContent>
      </Card>
    </main>
  );
}