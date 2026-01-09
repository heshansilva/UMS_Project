"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getCustomerById, Customer,
  getMetersByCustomer, Meter,
  getBillsByCustomer, Bill,
  getPaymentsByCustomer, Payment
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ArrowLeft, User, Phone, Mail, MapPin, Hash, BarChart, FileText, CreditCard } from "lucide-react";

// Helper for formatting
const formatCurrency = (value: number) => {
  return `Rs. ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        setLoading(true);
        // Fetch all data in parallel
        const [customerData, metersData, billsData, paymentsData] = await Promise.all([
          getCustomerById(id),
          getMetersByCustomer(id),
          getBillsByCustomer(id),
          getPaymentsByCustomer(id)
        ]);
        
        setCustomer(customerData);
        setMeters(metersData);
        setBills(billsData);
        setPayments(paymentsData);
        setLoading(false);
      };
      fetchData();
    }
  }, [id]);

  if (loading) {
    return <div className="text-muted-foreground">Loading customer details...</div>;
  }

  if (!customer) {
    return <div className="text-destructive">Customer not found.</div>;
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Paid": return "default";
      case "Pending": return "secondary";
      case "Overdue": return "destructive";
      case "Partial": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Customers
      </Button>

      {/* Customer Info Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-primary">{customer.CustomerName}</CardTitle>
            <Badge
              variant={customer.IsActive ? "default" : "destructive"}
              className={customer.IsActive ? "bg-green-600" : ""}
            >
              {customer.IsActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <CardDescription>{customer.CustomerType}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{customer.Email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{customer.ContactNumber}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{customer.City}</span>
          </div>
          <div className="flex items-center gap-3">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span>Total Meters: {customer.TotalMeters}</span>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">
              Outstanding: {formatCurrency(customer.OutstandingBalance)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Meters Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Meters</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meter #</TableHead>
                <TableHead>Utility</TableHead>
                <TableHead>Install Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meters.map((meter) => (
                <TableRow key={meter.MeterID}>
                  <TableCell>{meter.MeterNumber}</TableCell>
                  <TableCell>{meter.UtilityName}</TableCell>
                  <TableCell>{new Date(meter.InstallationDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={meter.MeterStatus === 'Active' ? 'default' : 'secondary'}
                      className={meter.MeterStatus === 'Active' ? 'bg-green-600' : ''}>
                      {meter.MeterStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bill History Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Bill History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill ID</TableHead>
                <TableHead>Meter #</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.BillID}>
                  <TableCell>{bill.BillID}</TableCell>
                  <TableCell>{bill.MeterNumber}</TableCell>
                  <TableCell>{formatCurrency(bill.TotalAmount)}</TableCell>
                  <TableCell>{new Date(bill.DueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(bill.BillStatus)}
                      className={bill.BillStatus === 'Paid' ? 'bg-green-600' : ''}>
                      {bill.BillStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Payment History Card (You can add this if needed) */}

    </div>
  );
}