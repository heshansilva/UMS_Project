"use client";

import { useState, useEffect } from "react";
import { getUnbilledReadings, UnbilledReading, generateBill } from "@/lib/api";
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
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function GenerateBillDialog({ onBillGenerated }: { onBillGenerated: () => void }) {
  const [open, setOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [readings, setReadings] = useState<UnbilledReading[]>([]);
  const [selectedReading, setSelectedReading] = useState<UnbilledReading | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch readings when the dialog is opened
  useEffect(() => {
    if (open) {
      const fetchReadings = async () => {
        const data = await getUnbilledReadings();
        setReadings(data);
      };
      fetchReadings();
    }
  }, [open]);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!selectedReading) {
      setError("Please select a reading to bill.");
      return;
    }

    try {
      await generateBill(selectedReading.MeterID, selectedReading.ReadingID);
      setSuccess("Bill generated successfully!");
      setSelectedReading(null);
      onBillGenerated(); // Refresh the bills table on the main page
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Generate New Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Bill</DialogTitle>
          <DialogDescription>
            Select an unbilled meter reading to generate a new bill.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={popoverOpen}
                className="w-full justify-between"
              >
                {selectedReading
                  ? `${selectedReading.MeterNumber} - ${selectedReading.CustomerName} (${selectedReading.Consumption} ${selectedReading.UtilityName === 'Electricity' ? 'kWh' : 'm³'})`
                  : "Select an unbilled reading..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search reading..." />
                <CommandEmpty>No readings found.</CommandEmpty>
                <CommandGroup>
                  <CommandList>
                    {readings.map((reading) => (
                      <CommandItem
                        key={reading.ReadingID}
                        value={`${reading.MeterNumber} ${reading.CustomerName} ${reading.Consumption}`}
                        onSelect={() => {
                          setSelectedReading(reading);
                          setPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedReading?.ReadingID === reading.ReadingID
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {`${reading.MeterNumber} - ${reading.CustomerName} (${reading.Consumption})`}
                      </CommandItem>
                    ))}
                  </CommandList>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-500">{success}</p>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={() => { setError(""); setSuccess(""); }}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Generate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}