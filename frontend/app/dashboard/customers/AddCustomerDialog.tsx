"use client";

import { useState, useEffect } from "react";
import {
  getCustomerTypes, CustomerType,
  getUtilityTypes, UtilityType,
  createNewCustomer, NewCustomerData
} from "@/lib/api";
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
import { PlusCircle } from "lucide-react";

// Helper to create the big form
function CustomerForm({ onSuccess }: { onSuccess: () => void }) {
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);
  const [utilityTypes, setUtilityTypes] = useState<UtilityType[]>([]);
  const [formData, setFormData] = useState<Partial<NewCustomerData>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch dropdown data when component mounts
  useEffect(() => {
    getCustomerTypes().then(setCustomerTypes).catch(err => {
      console.error("Failed to load customer types:", err);
      setError("Failed to load customer types");
    });
    getUtilityTypes().then(setUtilityTypes).catch(err => {
      console.error("Failed to load utility types:", err);
      setError("Failed to load utility types");
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (id: string, value: string) => {
    const numValue = parseInt(value);
    setFormData({ ...formData, [id]: numValue });
    console.log(`${id} set to:`, numValue); // Debug log
  };

  const validateForm = () => {
    const required = [
      'FirstName', 'LastName', 'NIC', 'ContactNumber', 'Email',
      'Address', 'City', 'PostalCode',
      'MeterNumber', 'UtilityTypeID', 'InitialReading'
    ];
    
    const missing = required.filter(field => !formData[field as keyof NewCustomerData]);
    
    if (missing.length > 0) {
      return `Please fill in: ${missing.join(', ')}`;
    }
    
    return null;
  };

  const handleSubmit = async () => {
    setError("");
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await createNewCustomer(formData as NewCustomerData);
      setLoading(false);
      onSuccess(); // This will close the modal and refresh the table
    } catch (err: any) {
      setError(err.message || "Failed to create customer");
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
      {/* Customer Details */}
      <h4 className="col-span-1 md:col-span-2 text-lg font-semibold text-primary">Customer Info</h4>
      <div className="space-y-2">
        <Label htmlFor="FirstName">First Name</Label>
        <Input id="FirstName" onChange={handleChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="LastName">Last Name</Label>
        <Input id="LastName" onChange={handleChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="NIC">NIC</Label>
        <Input id="NIC" onChange={handleChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ContactNumber">Contact Number</Label>
        <Input id="ContactNumber" onChange={handleChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="Email">Email</Label>
        <Input id="Email" type="email" onChange={handleChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="CustomerTypeID">Customer Type</Label>
        <Select onValueChange={(val) => handleSelectChange("CustomerTypeID", val)}>
          <SelectTrigger id="CustomerTypeID">
            <SelectValue placeholder="Select type..." />
          </SelectTrigger>
          <SelectContent>
            {customerTypes.length === 0 ? (
              <SelectItem value="loading" disabled>Loading...</SelectItem>
            ) : (
              customerTypes.map(type => (
                <SelectItem key={type.CustomerTypeID} value={type.CustomerTypeID.toString()}>
                  {type.TypeName}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="Address">Address</Label>
        <Input id="Address" onChange={handleChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="City">City</Label>
        <Input id="City" onChange={handleChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="PostalCode">Postal Code</Label>
        <Input id="PostalCode" onChange={handleChange} />
      </div>
      
      {/* Meter Details */}
      <h4 className="col-span-1 md:col-span-2 text-lg font-semibold text-primary mt-4">First Meter Info</h4>
      <div className="space-y-2">
        <Label htmlFor="MeterNumber">Meter Number</Label>
        <Input id="MeterNumber" onChange={handleChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="UtilityTypeID">Utility Type</Label>
        <Select onValueChange={(val) => handleSelectChange("UtilityTypeID", val)}>
          <SelectTrigger id="UtilityTypeID">
            <SelectValue placeholder="Select type..." />
          </SelectTrigger>
          <SelectContent>
            {utilityTypes.length === 0 ? (
              <SelectItem value="loading" disabled>Loading...</SelectItem>
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
        <Label htmlFor="InitialReading">Initial Reading</Label>
        <Input id="InitialReading" type="number" onChange={handleChange} />
      </div>

      {/* Error / Footer */}
      {error && <p className="col-span-1 md:col-span-2 text-sm text-destructive">{error}</p>}
      <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-4">
        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Create Customer"}
        </Button>
      </div>
    </div>
  );
}

// This is the component you'll import in your page
export function AddCustomerDialog({ onCustomerAdded }: { onCustomerAdded: () => void }) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false); // Close the modal
    onCustomerAdded(); // Refresh the table
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Customer & First Meter</DialogTitle>
          <DialogDescription>
            Fill in the details for the new customer and their first installed meter.
          </DialogDescription>
        </DialogHeader>
        <CustomerForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}