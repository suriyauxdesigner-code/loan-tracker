"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ForecastPoint } from "../forecast";

function fmtMonth(iso: unknown) {
  if (typeof iso !== "string") return "";
  return new Date(iso).toLocaleDateString("en-IN", { year: "2-digit", month: "short" });
}

function currencyTick(value: unknown) {
  const num = Number(value);
  if (Math.abs(num) >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(0)}k`;
  return String(num);
}

function currencyTooltip(currency: string) {
  return (value: unknown) => `${currency} ${Number(value).toFixed(2)}`;
}

export function ForecastCharts({
  series,
  currency,
  totalInterestPayable,
  todayMonthIndex,
}: {
  series: ForecastPoint[];
  currency: string;
  totalInterestPayable: number;
  todayMonthIndex: number | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outstanding Balance Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ left: 8, right: 16, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tickFormatter={fmtMonth} fontSize={12} />
              <YAxis tickFormatter={currencyTick} fontSize={12} width={48} />
              <Tooltip formatter={currencyTooltip(currency)} labelFormatter={fmtMonth} />
              {todayMonthIndex != null && (
                <ReferenceLine
                  x={series[todayMonthIndex]?.date}
                  stroke="var(--color-primary)"
                  strokeDasharray="4 4"
                  label={{ value: "Today", fontSize: 11, position: "insideTopRight" }}
                />
              )}
              <Line
                type="monotone"
                dataKey="outstanding"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Principal vs. Interest per Period</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ left: 8, right: 16, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tickFormatter={fmtMonth} fontSize={12} />
              <YAxis tickFormatter={currencyTick} fontSize={12} width={48} />
              <Tooltip formatter={currencyTooltip(currency)} labelFormatter={fmtMonth} />
              <Legend />
              <Bar dataKey="principal" stackId="a" name="Principal" fill="var(--color-primary)" />
              <Bar
                dataKey="interest"
                stackId="a"
                name="Interest"
                fill="var(--color-muted-foreground)"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Cumulative Interest Paid vs. Total Payable</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ left: 8, right: 16, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tickFormatter={fmtMonth} fontSize={12} />
              <YAxis tickFormatter={currencyTick} fontSize={12} width={48} />
              <Tooltip formatter={currencyTooltip(currency)} labelFormatter={fmtMonth} />
              <ReferenceLine
                y={totalInterestPayable}
                stroke="var(--color-muted-foreground)"
                strokeDasharray="4 4"
                label={{ value: "Total interest payable", fontSize: 11, position: "insideTopLeft" }}
              />
              <Area
                type="monotone"
                dataKey="cumulativeInterest"
                name="Cumulative interest paid"
                stroke="var(--color-primary)"
                fill="var(--color-primary)"
                fillOpacity={0.15}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
