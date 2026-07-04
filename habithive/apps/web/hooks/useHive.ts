"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyHive, type HiveDTO, type HiveHealthDTO } from "@/lib/api-client";

export interface UseHiveResult {
  hive: HiveDTO | null;
  health?: HiveHealthDTO;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useHive(): UseHiveResult {
  const query = useQuery({
    queryKey: ["hive", "me"],
    queryFn: getMyHive,
    // Poll every 5 seconds when the user has no hive yet —
    // stops polling once a hive is found (refetchInterval returning false).
    refetchInterval: (query) => {
      const hive = query.state.data?.hive;
      if (!hive || hive.status !== "active") return 5000;
      return false;
    },
  });

  return {
    hive: query.data?.hive ?? null,
    health: query.data?.health,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}