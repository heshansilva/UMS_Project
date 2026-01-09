"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker"; // Make sure this path is correct
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  runRevenueByPeriodReport,
  RevenueReportRow,
  runDefaultersReport,
  DefaulterReportRow,
} from "@/lib/api";
import { DateRange } from "react-day-picker";

// Helper function to format currency
const formatCurrency = (value: number) => {
  return `Rs. ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// --- Revenue Report Component ---
function RevenueReport() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [data, setData] = useState<RevenueReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRunReport = async () => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      alert("Please select a valid date range.");
      return;
    }
    setLoading(true);
    const result = await runRevenueByPeriodReport(
      dateRange.from.toISOString().split("T")[0],
      dateRange.to.toISOString().split("T")[0]
    );
    setData(result);
    setLoading(false);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Revenue by Period</CardTitle>
        <CardDescription>Run a report to see total revenue by utility in a date range.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <Label>Date Range</Label>
            <DatePicker dateRange={dateRange} setDateRange={setDateRange} />
          </div>
          <Button onClick={handleRunReport} disabled={loading} className="self-end">
            {loading ? "Running..." : "Run Report"}
          </Button>
        </div>
        
        {data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utility</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.UtilityName}>
                  <TableCell>{row.UtilityName}</TableCell>
                  <TableCell>{row.TotalTransactions}</TableCell>
                  <TableCell>{formatCurrency(row.TotalRevenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// --- Defaulters Report Component ---
function DefaultersReport() {
  const [days, setDays] = useState("30");
  const [data, setData] = useState<DefaulterReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRunReport = async () => {
    setLoading(true);
    const result = await runDefaultersReport(parseInt(days));
    setData(result);
    setLoading(false);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Defaulters Report</CardTitle>
        <CardDescription>Find customers with bills overdue by a specific number of days.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <Label htmlFor="days">Days Overdue (e.g., 30)</Label>
            <Input id="days" type="number" value={days} onChange={(e) => setDays(e.target.value)} />
          </div>
          <Button onClick={handleRunReport} disabled={loading} className="self-end">
            {loading ? "Running..." : "Run Report"}
          </Button>
        </div>

        {data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Total Outstanding</TableHead>
                <TableHead>Max Days Overdue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.CustomerID}>
                  <TableCell>{row.CustomerName}</TableCell>
                  <TableCell>{row.ContactNumber}</TableCell>
                  <TableCell>{formatCurrency(row.TotalOutstanding)}</TableCell>
                  <TableCell>{row.MaxDaysOverdue}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// --- Main Page ---
export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        Reports
      </h1>
      <RevenueReport />
      <DefaultersReport />
    </div>
  );
}