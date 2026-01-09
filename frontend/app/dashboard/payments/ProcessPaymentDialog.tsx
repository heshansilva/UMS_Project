"use client";

import { useState, useEffect } from "react";
import { getUnpaidBills, UnpaidBill, processPayment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProcessPaymentDialog({ onPaymentProcessed }: { onPaymentProcessed: () => void }) {
  const [open, setOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [unpaidBills, setUnpaidBills] = useState<UnpaidBill[]>([]);
  const [selectedBill, setSelectedBill] = useState<UnpaidBill | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [officer, setOfficer] = useState("Admin"); // Defaulting to 'Admin'
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (open) {
      const fetchBills = async () => {
        const data = await getUnpaidBills();
        setUnpaidBills(data);
      };
      fetchBills();
    }
  }, [open]);

  // When a bill is selected, pre-fill the amount
  useEffect(() => {
    if (selectedBill) {
      setAmount(selectedBill.RemainingBalance.toString());
    } else {
      setAmount("");}
  }, [selectedBill]);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!selectedBill || !amount || !method || !officer) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      await processPayment({
        BillID: selectedBill.BillID,
        AmountPaid: parseFloat(amount),
        PaymentMethod: method,
        ProcessedBy: officer,
        TransactionRef: reference,
      });
      setSuccess("Payment processed successfully!");
      setSelectedBill(null);
      setAmount("");
      setMethod("");
      setReference("");
      onPaymentProcessed(); // Refresh the payments table
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <CreditCard className="mr-2 h-4 w-4" />
          Process Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Process New Payment</DialogTitle>
          <DialogDescription>
            Select an unpaid bill to record a payment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Bill ComboBox */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bill" className="text-right">Bill</Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="col-span-3 justify-between">
                  {selectedBill
                    ? `Bill #${selectedBill.BillID} - ${selectedBill.CustomerName}`
                    : "Select unpaid bill..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search by Bill ID or Name..." />
                  <CommandEmpty>No unpaid bills found.</CommandEmpty>
                  <CommandGroup>
                    <CommandList>
                      {unpaidBills.map((bill) => (
                        <CommandItem
                          key={bill.BillID}
                          value={`Bill ${bill.BillID} ${bill.CustomerName} ${bill.RemainingBalance}`}
                          onSelect={() => {
                            setSelectedBill(bill);
                            setPopoverOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedBill?.BillID === bill.BillID ? "opacity-100" : "opacity-0")}/>
                          {`#${bill.BillID} - ${bill.CustomerName} (Rs. ${bill.RemainingBalance.toFixed(2)})`}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          {/* Amount Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">Amount</Label>
            <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3"/>
          </div>
          {/* Payment Method Select */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="method" className="text-right">Method</Label>
            <Select onValueChange={setMethod} value={method}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
              
              </SelectContent>
            </Select>
          </div>
          {/* Reference Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reference" className="text-right">Reference</Label>
            <Input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} className="col-span-3" placeholder="(Optional)"/>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-500">{success}</p>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={() => { setError(""); setSuccess(""); }}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Save Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}