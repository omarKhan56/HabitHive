"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCheckIn,
  getCheckInHistory,
  ApiError,
  type CheckInDTO,
} from "@/lib/api-client";
import type { CreateCheckInInput } from "@habithive/shared/schemas";

export interface UseCheckInsResult {
  history: CheckInDTO[];
  isLoading: boolean;
  isError: boolean;
  /** True if a CheckIn row already exists for today (date-only match, sec 2.3 unique constraint). */
  hasCheckedInToday: boolean;
  submit: (input: CreateCheckInInput) => void;
  isSubmitting: boolean;
  isSubmitSuccess: boolean;
  submitError: string | null;
}

function isSameUtcDay(isoDate: string, reference: Date) {
  const d = new Date(isoDate);
  return (
    d.getUTCFullYear() === reference.getUTCFullYear() &&
    d.getUTCMonth() === reference.getUTCMonth() &&
    d.getUTCDate() === reference.getUTCDate()
  );
}

/**
 * Wraps GET/POST /api/checkins (lib/services/checkin.service.ts on the
 * backend). Used by CheckInForm (submit) and CheckInHistory (read) so both
 * share one cache and stay in sync after a successful check-in.
 */
export function useCheckIns(hiveId: string | undefined): UseCheckInsResult {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["checkins", hiveId],
    queryFn: () => getCheckInHistory(hiveId as string),
    enabled: !!hiveId,
  });

  const mutation = useMutation({
    mutationFn: createCheckIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkins", hiveId] });
      // A successful check-in also affects hive health + miss counts.
      queryClient.invalidateQueries({ queryKey: ["hive", "me"] });
    },
  });

  const today = new Date();
  const hasCheckedInToday = (query.data ?? []).some((c) => isSameUtcDay(c.date, today));

  let submitError: string | null = null;
  if (mutation.isError) {
    const err = mutation.error;
    submitError =
      err instanceof ApiError && err.status === 409
        ? "You already checked in today."
        : "Couldn't submit your check-in. Please try again.";
  }

  return {
    history: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    hasCheckedInToday,
    submit: (input) => mutation.mutate(input),
    isSubmitting: mutation.isPending,
    isSubmitSuccess: mutation.isSuccess,
    submitError,
  };
}