"use client";

import { useChat } from "ai/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getWeeklySummary, type AiInsightDTO } from "@/lib/api-client";
import type { ChangeEvent } from "react";

export interface UseAICoachResult {
  /** Streaming coach chat — powered by Groq via /api/ai/coach */
  messages: { id: string; role: "user" | "assistant" | "system"; content: string }[];
  input: string;
  /** Matches the exact signature the Vercel AI SDK's useChat() returns */
  handleInputChange: (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isStreaming: boolean;
  chatError: Error | undefined;

  /** Weekly summary — fetched from /api/ai/weekly-summary (Groq-generated) */
  summary: AiInsightDTO | null;
  isSummaryLoading: boolean;
  isSummaryError: boolean;
  refreshSummary: () => void;
}

/**
 * Combines the Vercel AI SDK's useChat() for streaming coach chat (Groq)
 * with a React Query fetch for the weekly summary (sec 2.4 AI Service).
 */
export function useAICoach(): UseAICoachResult {
  const queryClient = useQueryClient();

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: isStreaming,
    error: chatError,
  } = useChat({ api: "/api/ai/coach" });

  const summaryQuery = useQuery({
    queryKey: ["ai", "weekly-summary"],
    queryFn: getWeeklySummary,
    // Don't refetch automatically — summaries are expensive Groq calls,
    // cached server-side for 7 days (see app/api/ai/weekly-summary/route.ts).
    staleTime: 7 * 24 * 60 * 60 * 1000,
  });

  function refreshSummary() {
    queryClient.invalidateQueries({ queryKey: ["ai", "weekly-summary"] });
  }

  return {
    messages: messages.filter((m) => m.role !== "system") as any,
    input,
    handleInputChange,
    handleSubmit,
    isStreaming,
    chatError,
    summary: summaryQuery.data ?? null,
    isSummaryLoading: summaryQuery.isLoading,
    isSummaryError: summaryQuery.isError,
    refreshSummary,
  };
}