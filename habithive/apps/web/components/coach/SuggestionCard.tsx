import { Lightbulb } from "lucide-react";
import { Card, CardContent, Badge } from "@/components/ui";
import type { AiInsightDTO } from "@/lib/api-client";

export interface SuggestionCardProps {
  insight: AiInsightDTO;
}

function riskVariant(score: number | null) {
  if (!score) return "default" as const;
  if (score >= 0.7) return "danger" as const;
  if (score >= 0.4) return "warning" as const;
  return "info" as const;
}

function riskLabel(score: number | null) {
  if (!score) return null;
  if (score >= 0.7) return "High risk";
  if (score >= 0.4) return "At risk";
  return "Low risk";
}

/**
 * Compact card for a single AI-generated nudge/suggestion (type: suggestion
 * in ai_insights). Includes the deterministic risk score badge — the LLM
 * only phrased the suggestion; the score itself came from analytics.service.ts
 * (sec 2.4 Risk Prediction — rule-based, not LLM-determined).
 */
export function SuggestionCard({ insight }: SuggestionCardProps) {
  const label = riskLabel(insight.riskScore);

  return (
    <Card>
      <CardContent className="flex gap-3 py-4">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Lightbulb className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex flex-col gap-1.5">
          {label && (
            <Badge variant={riskVariant(insight.riskScore)}>{label}</Badge>
          )}
          <p className="text-sm text-slate-700">{insight.content}</p>
          <p className="text-xs text-slate-400">
            {new Date(insight.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}