"use client";

import { useState, useEffect } from "react";
import { getAllTariffs, Tariff, deleteTariff } from "@/lib/api";
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
} from "@/components/ui/alert-dialog";
import { TariffEditDialog } from "./TariffEditDialog";
import { Trash2 } from "lucide-react";

// Helper to group tariffs by UtilityName
const groupTariffs = (tariffs: Tariff[]) => {
  return tariffs.reduce((acc, tariff) => {
    (acc[tariff.UtilityName] = acc[tariff.UtilityName] || []).push(tariff);
    return acc;
  }, {} as Record<string, Tariff[]>);
};

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTariffs = async () => {
    setLoading(true);
    const data = await getAllTariffs();
    setTariffs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTariffs();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await deleteTariff(id);
      fetchTariffs(); // Refresh list after delete
    } catch (error: any) {
      alert(error.message); // Show error (e.g., "Cannot delete...")
    }
  };

  const formatCurrency = (value: number) => `Rs. ${value.toFixed(2)}`;
  const formatUnits = (min: number, max: number | null, unit: string) => {
    if (max) return `${min} - ${max} ${unit}`;
    return `> ${min} ${unit}`;
  };

  const groupedTariffs = groupTariffs(tariffs);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">
          Tariff & Pricing Management
        </h1>
        <TariffEditDialog onSuccess={fetchTariffs} />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading tariffs...</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {Object.entries(groupedTariffs).map(([utilityName, plans]) => (
            <Card key={utilityName} className="bg-card border-border">
              <CardHeader>
                <CardTitle>{utilityName}</CardTitle>
                <CardDescription>Billing in {plans[0]?.Unit}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan Name</TableHead>
                      <TableHead>Unit Range</TableHead>
                      <TableHead>Rate/Unit</TableHead>
                      <TableHead>Fixed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <TableRow key={plan.TariffID}>
                        <TableCell>{plan.PlanName}</TableCell>
                        <TableCell>{formatUnits(plan.MinUnits, plan.MaxUnits, plan.Unit)}</TableCell>
                        <TableCell>{formatCurrency(plan.RatePerUnit)}</TableCell>
                        <TableCell>{formatCurrency(plan.FixedCharge)}</TableCell>
                        <TableCell>
                          <Badge variant={plan.IsActive ? "default" : "destructive"}
                            className={plan.IsActive ? "bg-green-600" : ""}>
                            {plan.IsActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <TariffEditDialog tariff={plan} onSuccess={fetchTariffs} />
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete Tariff</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the plan
                                  "{plan.PlanName}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(plan.TariffID)} className="bg-destructive hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}