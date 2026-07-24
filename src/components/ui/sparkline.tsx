"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { IconTone } from "./icon-container";

const TONE_STROKE: Record<IconTone, string> = {
  violet: "var(--color-chart-1)",
  emerald: "var(--color-chart-2)",
  amber: "var(--color-chart-3)",
  sky: "var(--color-chart-4)",
  rose: "var(--color-chart-5)",
  slate: "var(--color-muted-foreground)",
};

export function Sparkline({
  data,
  tone = "violet",
  height = 40,
}: {
  data: number[];
  tone?: IconTone;
  height?: number;
}) {
  const gradientId = useId();
  if (data.length < 2) return null;

  const points = data.map((value, i) => ({ i, value }));
  const stroke = TONE_STROKE[tone];

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={1.75}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
