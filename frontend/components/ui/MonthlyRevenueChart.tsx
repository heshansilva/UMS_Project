"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MonthlyRevenue } from "@/lib/api";

interface ChartProps {
  data: MonthlyRevenue[];
}

// Helper to process data for the chart
const processData = (data: MonthlyRevenue[]) => {
  const chartData: { name: string; Electricity: number; Water: number; Internet: number }[] = [];
  const months: { [key: string]: { Electricity: number; Water: number; Internet: number } } = {};

  data.forEach(item => {
    const monthName = item.MonthName.substring(0, 3);
    const key = `${item.Year}-${monthName}`;
    if (!months[key]) {
      months[key] = { Electricity: 0, Water: 0, Internet: 0 };
    }
    months[key][item.UtilityName as 'Electricity' | 'Water' | 'Internet'] = item.TotalRevenue;
  });

  // Sort keys to ensure chronological order
  const sortedKeys = Object.keys(months).sort((a, b) => {
      const [aYear, aMonth] = a.split('-');
      const [bYear, bMonth] = b.split('-');
      if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
      const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth);
  });

  sortedKeys.forEach(key => {
    chartData.push({ name: key.split('-')[1], ...months[key] });
  });
  
  return chartData;
};

export function MonthlyRevenueChart({ data }: ChartProps) {
  const chartData = processData(data);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `Rs.${value / 1000}k`}
        />
        <Tooltip
          contentStyle={{ backgroundColor: "#1f2833", border: "none", color: "#c5c6c7" }}
          labelStyle={{ color: "#66fcf1" }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="Electricity"
          stroke="#66fcf1" // Your primary cyan
          activeDot={{ r: 8 }}
        />
        <Line type="monotone" dataKey="Water" stroke="#3b82f6" />
        <Line type="monotone" dataKey="Internet" stroke="#f97316" />
      </LineChart>
    </ResponsiveContainer>
  );
}