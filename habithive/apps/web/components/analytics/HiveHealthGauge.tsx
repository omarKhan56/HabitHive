"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

export interface HiveHealthGaugeProps {
  score: number; // 0-100
  breakdown: {
    completionRate: number;
    missHealth: number;
    engagement: number;
  } | null;
}

function scoreColor(score: number) {
  if (score >= 70) return "#10b981"; // emerald
  if (score >= 40) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

function scoreLabel(score: number) {
  if (score >= 70) return "Healthy";
  if (score >= 40) return "At Risk";
  return "Critical";
}

/**
 * Radial gauge showing the hive health score (0-100) computed by
 * analytics.service.ts and cached in Redis. Score colour escalates with risk.
 */
export function HiveHealthGauge({ score, breakdown }: HiveHealthGaugeProps) {
  const color = scoreColor(score);
  const data = [{ value: score, fill: color }];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-36 w-36">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "#f1f5f9" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>
            {score}
          </span>
          <span className="text-xs text-slate-400">{scoreLabel(score)}</span>
        </div>
      </div>

      {breakdown && (
        <div className="grid w-full grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-medium text-slate-700">
              {Math.round(breakdown.completionRate * 100)}%
            </p>
            <p className="text-slate-400">Completion</p>
          </div>
          <div>
            <p className="font-medium text-slate-700">
              {Math.round(breakdown.missHealth * 100)}%
            </p>
            <p className="text-slate-400">Consistency</p>
          </div>
          <div>
            <p className="font-medium text-slate-700">
              {Math.round(breakdown.engagement * 100)}%
            </p>
            <p className="text-slate-400">Engagement</p>
          </div>
        </div>
      )}
    </div>
  );
}