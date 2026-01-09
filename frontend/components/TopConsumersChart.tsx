"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TopConsumer } from "@/lib/api";

interface ChartProps {
  data: TopConsumer[];
}

export function TopConsumersChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="CustomerName"
          stroke="#888888"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          angle={-10}
          textAnchor="end"
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{ backgroundColor: "#1f2833", border: "none", color: "#c5c6c7" }}
          labelStyle={{ color: "#66fcf1" }}
        />
        <Legend />
        <Bar
          dataKey="TotalConsumption"
          fill="#22c55e" // Your secondary green
          radius={[4, 4, 0, 0]}
          name="Total Consumption"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
