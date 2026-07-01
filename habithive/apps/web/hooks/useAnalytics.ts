"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyHive, getCheckInHistory } from "@/lib/api-client";

export interface AnalyticsData {
  completionRate: number;
  streak: number;
  totalCheckIns: number;
  hiveHealthScore: number;
  hiveHealthBreakdown: {
    completionRate: number;
    missHealth: number;
    engagement: number;
  } | null;
  checkInDates: string[];
}

/**
 * Derives analytics data from existing hive + check-in queries — no new
 * API route needed since analytics.service.ts already computes and returns
 * health scores via GET /api/hives, and check-in history comes from
 * GET /api/checkins (sec 2.4 Analytics Service).
 */
export function useAnalytics(): {
  data: AnalyticsData | null;
  isLoading: boolean;
  isError: boolean;
} {
  const hiveQuery = useQuery({
    queryKey: ["hive", "me"],
    queryFn: getMyHive,
  });

  const hiveId = hiveQuery.data?.hive?.id;

  const checkInsQuery = useQuery({
    queryKey: ["checkins", hiveId],
    queryFn: () => getCheckInHistory(hiveId as string),
    enabled: !!hiveId,
  });

  const isLoading = hiveQuery.isLoading || checkInsQuery.isLoading;
  const isError = hiveQuery.isError || checkInsQuery.isError;

  if (isLoading || isError || !hiveQuery.data?.hive) {
    return { data: null, isLoading, isError };
  }

  const checkIns = checkInsQuery.data ?? [];
  const health = hiveQuery.data.health;

  // Streak: count consecutive days from today backwards
  let streak = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  const sortedDates = [...checkIns]
    .map((c) => {
      const d = new Date(c.date);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    })
    .sort((a, b) => b.getTime() - a.getTime());

  for (const d of sortedDates) {
    if (d.getTime() === cursor.getTime()) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (d.getTime() < cursor.getTime()) {
      break;
    }
  }

  const trailing14 = checkIns.filter((c) => {
    const d = new Date(c.date);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    return d >= cutoff;
  });

  const completionRate = trailing14.length / 14;

  return {
    data: {
      completionRate,
      streak,
      totalCheckIns: checkIns.length,
      hiveHealthScore: health?.score ?? 0,
      hiveHealthBreakdown: health?.breakdown ?? null,
      checkInDates: checkIns.map((c) => c.date),
    },
    isLoading: false,
    isError: false,
  };
}