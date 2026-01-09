"use client";

import { useState, useEffect } from "react";
import { getAllPayments, Payment, deletePayment } from "@/lib/api"; 
import { useAuth } from "@/hooks/useAuth"; 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // 3. Import AlertDialog
import { Button } from "@/components/ui/button";
import { ProcessPaymentDialog } from "./ProcessPaymentDialog";
import { Trash2 } from "lucide-react"; // 4. Import Trash icon

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth(); // 5. Get the user's role
  const isAdmin = role === 'Admin'; // Check if user is Admin

  const fetchPayments = async () => {
    setLoading(true);
    const data = await getAllPayments();
    setPayments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // 6. Create the delete handler
  const handleDelete = async (id: number) => {
    try {
      await deletePayment(id);
      fetchPayments(); // Refresh the list
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const formatCurrency = (value: number) => {
    return `Rs. ${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">
          Payment History
        </h1>
        <ProcessPaymentDialog onPaymentProcessed={fetchPayments} />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount Paid</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              {/* 7. Conditionally show Actions column */}
              {isAdmin && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="text-center">
                  Loading payments...
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.PaymentID}>
                  <TableCell>{payment.PaymentID}</TableCell>
                  <TableCell>
                    {new Date(payment.PaymentDate).toLocaleString()}
                  </TableCell>
                  <TableCell>{payment.CustomerName}</TableCell>
                  <TableCell>{formatCurrency(payment.AmountPaid)}</TableCell>
                  <TableCell>{payment.PaymentMethod}</TableCell>
                  <TableCell>{payment.TransactionReference || "N/A"}</TableCell>
                  {/* 8. Conditionally show Delete button */}
                  {isAdmin && (
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete Payment</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete Payment ID #{payment.PaymentID}
                              and update the corresponding bill's balance.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(payment.PaymentID)} className="bg-destructive hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}