"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface CompletionChartProps {
  /** ISO date strings of days the user checked in */
  checkInDates: string[];
}

function getLast14Days(): string[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "numeric",
    day: "numeric",
  });
}

/**
 * Bar chart showing the trailing 14-day check-in history.
 * Green bar = checked in, grey = missed. Uses Recharts (sec 1.6).
 */
export function CompletionChart({ checkInDates }: CompletionChartProps) {
  const checkedInSet = new Set(checkInDates.map((d) => d.slice(0, 10)));

  const data = getLast14Days().map((date) => ({
    date,
    label: formatDay(date),
    checked: checkedInSet.has(date) ? 1 : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barSize={16} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          interval={1}
        />
        <YAxis hide domain={[0, 1]} />
        <Tooltip
          formatter={() => ""}
          labelFormatter={(label) => label}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            borderColor: "#e2e8f0",
          }}
        />
        <Bar dataKey="checked" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.date}
              fill={entry.checked ? "#10b981" : "#e2e8f0"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}