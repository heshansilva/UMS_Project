"use client";

import { useState, useEffect } from "react";
import { getAllBills, Bill } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GenerateBillDialog } from "./GenerateBillDialog"; 

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBills = async () => {
    setLoading(true);
    const data = await getAllBills();
    setBills(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const formatCurrency = (value: number) => {
    return `Rs. ${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Paid":
        return "default";
      case "Pending":
        return "secondary";
      case "Overdue":
        return "destructive";
      case "Partial":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">
          Bill Management
        </h1>
        {/* Pass the refresh function to the dialog */}
        <GenerateBillDialog onBillGenerated={fetchBills} />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Meter #</TableHead>
              <TableHead>Period End</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading bills...
                </TableCell>
              </TableRow>
            ) : (
              bills.map((bill) => (
                <TableRow key={bill.BillID}>
                  <TableCell>{bill.BillID}</TableCell>
                  <TableCell>{bill.CustomerName}</TableCell>
                  <TableCell>{bill.MeterNumber}</TableCell>
                  <TableCell>
                    {new Date(bill.BillingPeriodEnd).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{formatCurrency(bill.TotalAmount)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusVariant(bill.BillStatus)}
                      className={bill.BillStatus === 'Paid' ? "bg-green-600" : ""}
                    >
                      {bill.BillStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(bill.DueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}