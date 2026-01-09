"use client";

import { useState, useEffect } from "react";
import { Tariff, NewTariffData, UpdateTariffData, UtilityType, getUtilityTypes, createTariff, updateTariff } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Pencil } from "lucide-react";

// Get props for either editing an existing tariff or adding a new one
type TariffDialogProps = {
  tariff?: Tariff; // Provide this when editing
  onSuccess: () => void; // Function to refresh data
};

export function TariffEditDialog({ tariff, onSuccess }: TariffDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<NewTariffData | UpdateTariffData>>({});
  const [utilityTypes, setUtilityTypes] = useState<UtilityType[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEditMode = !!tariff;

  // Load utility types for the "Add New" dropdown
  useEffect(() => {
    if (!isEditMode) {
      getUtilityTypes().then(setUtilityTypes);
    }
  }, [isEditMode]);

  // Pre-fill form when in edit mode
  useEffect(() => {
    if (isEditMode) {
      setFormData({
        ...tariff,
        EffectiveFromDate: tariff.EffectiveFromDate.split('T')[0], // Format date for input
      });
    } else {
      setFormData({
        EffectiveFromDate: new Date().toISOString().split('T')[0], // Default to today
        IsActive: true,
        FixedCharge: 0,
        MinUnits: 0,
      });
    }
  }, [tariff, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [id]: checked });
    } else if (type === 'number') {
      setFormData({ ...formData, [id]: value === '' ? null : parseFloat(value) });
    } else {
      setFormData({ ...formData, [id]: value });
    }
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData({ ...formData, [id]: parseInt(value) });
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      if (isEditMode) {
        // Update existing tariff
        await updateTariff(tariff.TariffID, formData as UpdateTariffData);
      } else {
        // Create new tariff
        await createTariff(formData as NewTariffData);
      }
      setLoading(false);
      onSuccess(); // Refresh table
      setOpen(false); // Close modal
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditMode ? (
          <Button variant="outline" size="icon">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit Tariff</span>
          </Button>
        ) : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Tariff
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Tariff Plan" : "Add New Tariff Plan"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? `Modify details for ${tariff.PlanName}` : "Create a new pricing tier for a utility."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="PlanName">Plan Name</Label>
            <Input id="PlanName" value={formData.PlanName || ""} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="UtilityTypeID">Utility</Label>
            <Select
              disabled={isEditMode}
              onValueChange={(val) => handleSelectChange("UtilityTypeID", val)}
              value={formData.UtilityTypeID?.toString()}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select utility..." />
              </SelectTrigger>
              <SelectContent>
                {isEditMode ? (
                  <SelectItem value={tariff.UtilityTypeID.toString()}>{tariff.UtilityName}</SelectItem>
                ) : (
                  utilityTypes.map(type => (
                    <SelectItem key={type.UtilityTypeID} value={type.UtilityTypeID.toString()}>
                      {type.UtilityName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="MinUnits">Min Units</Label>
            <Input id="MinUnits" type="number" value={formData.MinUnits ?? 0} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="MaxUnits">Max Units (optional)</Label>
            <Input id="MaxUnits" type="number" value={formData.MaxUnits ?? ""} onChange={handleChange} placeholder="Leave blank for no max" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="RatePerUnit">Rate per Unit (Rs.)</Label>
            <Input id="RatePerUnit" type="number" value={formData.RatePerUnit || ""} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="FixedCharge">Fixed Charge (Rs.)</Label>
            <Input id="FixedCharge" type="number" value={formData.FixedCharge ?? 0} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="EffectiveFromDate">Effective Date</Label>
            <Input id="EffectiveFromDate" type="date" value={formData.EffectiveFromDate || ""} onChange={handleChange} disabled={isEditMode} />
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Switch id="IsActive" checked={formData.IsActive ?? true} onCheckedChange={(val) => setFormData({...formData, IsActive: val})} />
            <Label htmlFor="IsActive">Plan is Active</Label>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}