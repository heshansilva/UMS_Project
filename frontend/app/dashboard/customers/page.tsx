"use client";

import { useState, useEffect } from "react";
import { getAllCustomers, Customer } from "@/lib/api";
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
import { AddCustomerDialog } from "./AddCustomerDialog";
import Link from "next/link"; // <-- 1. IMPORT Link
import { Eye } from "lucide-react"; // <-- 2. IMPORT an icon

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to refresh the table
  const fetchCustomers = async () => {
    setLoading(true);
    const data = await getAllCustomers();
    setCustomers(data);
    setLoading(false);
  };

  // Call it on initial load
  useEffect(() => {
    fetchCustomers();
  }, []);

  const formatCurrency = (value: number | null) => {
    if (value === null || value === 0) return "Rs. 0.00";
    return `Rs. ${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">
          Customer Management
        </h1>
        {/* This button is now the functional dialog */}
        <AddCustomerDialog onCustomerAdded={fetchCustomers} />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading customer data...
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.CustomerID}>
                  <TableCell className="font-medium">
                    {customer.CustomerName}
                  </TableCell>
                  <TableCell>{customer.CustomerType}</TableCell>
                  <TableCell>{customer.ContactNumber}</TableCell>
                  <TableCell>{customer.City}</TableCell>
                  <TableCell>
                    {formatCurrency(customer.OutstandingBalance)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={customer.IsActive ? "default" : "destructive"}
                      className={customer.IsActive ? "bg-green-600" : ""}
                    >
                      {customer.IsActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {/* 3. THIS IS THE UPDATED BUTTON */}
                    <Button variant="outline" size="icon" asChild>
                      <Link href={`/dashboard/customers/${customer.CustomerID}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Details</span>
                      </Link>
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