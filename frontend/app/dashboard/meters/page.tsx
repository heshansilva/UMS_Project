"use client";

import { useState, useEffect } from "react";
import { getAllMeters, Meter, addNewMeterReading } from "@/lib/api";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Droplet, Zap, Wifi } from "lucide-react"; // <-- IMPORTED Wifi

// Helper component for the "Add Reading" dialog
function AddReadingDialog({ meter }: { meter: Meter }) {
  const [reading, setReading] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [officer, setOfficer] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!reading || !date || !officer) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      await addNewMeterReading({
        MeterID: meter.MeterID,
        ReadingDate: date,
        CurrentReading: parseFloat(reading),
        ReadingTakenBy: officer,
        Notes: notes,
      });
      setSuccess("Usage data added successfully!");
      // Clear form
      setReading("");
      setOfficer("");
      setNotes("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Dialog onOpenChange={() => { setError(""); setSuccess(""); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Usage
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Usage for {meter.MeterNumber}</DialogTitle>
          <DialogDescription>
            Enter the new data usage for {meter.CustomerName}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reading" className="text-right">
              Usage ({meter.Unit})
            </Label>
            <Input
              id="reading"
              type="number"
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              placeholder="e.g., 50.5"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="officer" className="text-right">
              Source
            </Label>
            <Input
              id="officer"
              value={officer}
              onChange={(e) => setOfficer(e.target.value)}
              placeholder="e.g., System Sync"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="(Optional)"
              className="col-span-3"
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-500">{success}</p>}
        <DialogFooter>
          <DialogClose asChild>
             <Button variant="outline">Close</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Save Usage</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main page component
export default function MetersPage() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getAllMeters();
      setMeters(data);
      setLoading(false);
    };

    fetchData();
  }, []);

  const getUtilityIcon = (utilityName: string) => {
    switch (utilityName) {
      case "Electricity":
        return <Zap className="h-4 w-4 text-yellow-400" />;
      case "Water":
        return <Droplet className="h-4 w-4 text-blue-400" />;
      case "Internet": // <-- UPDATED from "Gas"
        return <Wifi className="h-4 w-4 text-cyan-400" />; // <-- UPDATED from "Flame"
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">Meter Management</h1>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Meter #</TableHead>
              <TableHead>Utility</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Install Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading meter data...
                </TableCell>
              </TableRow>
            ) : (
              meters.map((meter) => (
                <TableRow key={meter.MeterID}>
                  <TableCell className="font-medium">
                    {meter.MeterNumber}
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    {getUtilityIcon(meter.UtilityName)}
                    {meter.UtilityName}
                  </TableCell>
                  <TableCell>{meter.CustomerName}</TableCell>
                  <TableCell>
                    {new Date(meter.InstallationDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={meter.MeterStatus === 'Active' ? "default" : "destructive"}
                      className={meter.MeterStatus === 'Active' ? "bg-green-600" : "bg-gray-500"}
                    >
                      {meter.MeterStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <AddReadingDialog meter={meter} />
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