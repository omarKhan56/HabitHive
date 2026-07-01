"use client";

import { Bot } from "lucide-react";
import { useAICoach } from "@/hooks/useAICoach";
import { WeeklySummaryCard } from "@/components/coach/WeeklySummaryCard";
import { CoachChatWidget } from "@/components/coach/CoachChatWidget";

export default function CoachPage() {
  const {
    summary,
    isSummaryLoading,
    isSummaryError,
    refreshSummary,
  } = useAICoach();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
          <Bot className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-800">AI Coach</h1>
          <p className="text-sm text-slate-500">
            Powered by Groq — responses stream in real time.
          </p>
        </div>
      </div>

      <WeeklySummaryCard
        summary={summary}
        isLoading={isSummaryLoading}
        isError={isSummaryError}
        onRefresh={refreshSummary}
      />

      <div className="mt-4 h-[480px]">
        <CoachChatWidget />
      </div>
    </main>
  );
}