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
 
/**
 * Wraps GET /api/hives (lib/services/matching.service.ts + analytics.service.ts
 * on the backend) with React Query caching. Used by the dashboard and hive
 * detail page so both stay in sync without duplicating fetch logic.
 */
export function useHive(): UseHiveResult {
  const query = useQuery({
    queryKey: ["hive", "me"],
    queryFn: getMyHive,
  });
 
  return {
    hive: query.data?.hive ?? null,
    health: query.data?.health,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}