import { RefreshCw, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Spinner } from "@/components/ui";
import type { AiInsightDTO } from "@/lib/api-client";

export interface WeeklySummaryCardProps {
  summary: AiInsightDTO | null;
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
}

/**
 * Displays the Groq-generated weekly summary + suggestion stored in
 * ai_insights (type: weekly_summary). Content is plain text in the format:
 * "Summary: <text>\nSuggestion: <text>"
 * as produced by ai.service.ts#generateWeeklySummary.
 */
export function WeeklySummaryCard({
  summary,
  isLoading,
  isError,
  onRefresh,
}: WeeklySummaryCardProps) {
  function parseContent(content: string) {
    const summaryMatch = content.match(/Summary:\s*(.+?)(?=Suggestion:|$)/s);
    const suggestionMatch = content.match(/Suggestion:\s*(.+)/s);
    return {
      summaryText: summaryMatch?.[1]?.trim() ?? content,
      suggestion: suggestionMatch?.[1]?.trim() ?? null,
    };
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <CardTitle>Weekly Summary</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          aria-label="Refresh summary"
          loading={isLoading}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading && <Spinner label="Generating your summary…" className="py-4" />}

        {isError && (
          <p className="text-sm text-red-500">
            Couldn&#x2019;t load your summary. Try refreshing.
          </p>
        )}

        {!isLoading && !isError && !summary && (
          <p className="text-sm text-slate-400">
            No summary yet — check back after your first week of check-ins.
          </p>
        )}

        {!isLoading && !isError && summary && (() => {
          const { summaryText, suggestion } = parseContent(summary.content);
          return (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-700 leading-relaxed">{summaryText}</p>
              {suggestion && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-700 mb-1">
                    Suggestion for next week
                  </p>
                  <p className="text-sm text-amber-800">{suggestion}</p>
                </div>
              )}
              <p className="text-xs text-slate-400">
                Generated{" "}
                {new Date(summary.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}