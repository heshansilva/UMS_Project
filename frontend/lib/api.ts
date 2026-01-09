import axios from "axios";

// Create an axios instance pointing to your backend
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// --- !!! IMPORTANT: Add the Auth Interceptor !!! ---
// This code will run before *every* request.
api.interceptors.request.use(
  (config) => {
    // 1. Get the token from localStorage
    const token = localStorage.getItem("ums_token");

    // 2. If the token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 3. Continue with the request
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Auth Functions ---
export interface LoginData {
  Username: string;
  Password: string;
}

export interface AuthResponse {
  UserID: number;
  Username: string;
  Role: string;
  token: string;
}

export const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    // We use a separate 'axios.post' for login,
    // as it doesn't need an auth token itself.
    const response = await axios.post(
      "http://localhost:5000/api/auth/login",
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error logging in:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Login failed");
    }
    throw new Error("Login failed");
  }
};


// --- Dashboard Stats ---
export interface DashboardStats {
  totalCustomers: number;
  totalActiveMeters: number;
  totalOutstanding: number | null;
  monthlyRevenue: number | null;
  pendingBills: number;
  openComplaints: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await api.get("/reports/dashboard"); // Uses the 'api' instance
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalCustomers: 0,
      totalActiveMeters: 0,
      totalOutstanding: 0,
      monthlyRevenue: 0,
      pendingBills: 0,
      openComplaints: 0,
    };
  }
};

// --- Customer Data ---
export interface Customer {
  CustomerID: number;
  CustomerName: string;
  CustomerType: string;
  ContactNumber: string;
  Email: string;
  City: string;
  TotalMeters: number;
  OutstandingBalance: number;
  IsActive: boolean;
}

export const getAllCustomers = async (): Promise<Customer[]> => {
  try {
    const response = await api.get("/customers"); // Uses the 'api' instance
    return response.data;
  } catch (error) {
    console.error("Error fetching all customers:", error);
    return [];
  }
};

export interface CustomerType {
  CustomerTypeID: number;
  TypeName: string;
}

export interface UtilityType {
  UtilityTypeID: number;
  UtilityName: string;
}

export const getCustomerTypes = async (): Promise<CustomerType[]> => {
  try {
    const response = await api.get("/customers/types");
    return response.data;
  } catch (error) { 
    console.error("Error fetching customer types:", error);
    return []; 
  }
};

export const getUtilityTypes = async (): Promise<UtilityType[]> => {
  try {
    const response = await api.get("/meters/types");
    return response.data;
  } catch (error) { 
    console.error("Error fetching utility types:", error);
    return []; 
  }
};

export interface NewCustomerData {
  CustomerTypeID: number;
  FirstName: string;
  LastName: string;
  NIC: string;
  ContactNumber: string;
  Email: string;
  Address: string;
  City: string;
  PostalCode: string;
  UtilityTypeID: number;
  MeterNumber: string;
  InitialReading: number;
}

export const createNewCustomer = async (data: NewCustomerData) => {
  try {
    const response = await api.post("/customers", data);
    return response.data;
  } catch (error) {
    console.error("Error creating new customer:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Failed to create customer");
    }
    throw new Error("Failed to create customer");
  }
};


// --- Meter Data ---
export interface Meter {
  MeterID: number;
  MeterNumber: string;
  UtilityName: string;
  Unit: string;
  CustomerName: string;
  InstallationDate: string;
  MeterStatus: string;
}

export const getAllMeters = async (): Promise<Meter[]> => {
  try {
    const response = await api.get("/meters");
    return response.data;
  } catch (error) {
    console.error("Error fetching all meters:", error);
    return [];
  }
};

export interface NewReadingData {
  MeterID: number;
  ReadingDate: string;
  CurrentReading: number;
  ReadingTakenBy: string;
  Notes?: string;
}

export const addNewMeterReading = async (data: NewReadingData) => {
  try {
    const response = await api.post("/meters/reading", data);
    return response.data;
  } catch (error) {
    console.error("Error adding new meter reading:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Failed to add reading");
    }
    throw new Error("Failed to add reading");
  }
};

// --- Bill Data ---
export interface Bill {
  BillID: number;
  CustomerName: string;
  MeterNumber: string;
  UtilityName: string;
  BillingPeriodEnd: string;
  TotalAmount: number;
  BillStatus: string;
  DueDate: string;
  // Fields for Bill History
  BillingPeriodStart?: string;
  Consumption?: number;
  AmountPaid?: number;
  Balance?: number;
}

export const getAllBills = async (): Promise<Bill[]> => {
  try {
    const response = await api.get("/bills");
    return response.data;
  } catch (error) {
    console.error("Error fetching all bills:", error);
    return [];
  }
};

export interface UnbilledReading {
  ReadingID: number;
  MeterID: number;
  MeterNumber: string;
  CustomerName: string;
  ReadingDate: string;
  Consumption: number;
  Unit: string;
}

export const getUnbilledReadings = async (): Promise<UnbilledReading[]> => {
  try {
    const response = await api.get("/bills/unbilled-readings");
    return response.data;
  } catch (error) {
    console.error("Error fetching unbilled readings:", error);
    return [];
  }
};

export const generateBill = async (MeterID: number, ReadingID: number) => {
  try {
    const response = await api.post("/bills/generate", { MeterID, ReadingID });
    return response.data;
  } catch (error) {
    console.error("Error generating bill:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Failed to generate bill");
    }
    throw new Error("Failed to generate bill");
  }
};

// --- Payment Data ---
export interface Payment {
  PaymentID: number;
  PaymentDate: string;
  AmountPaid: number;
  PaymentMethod: string;
  CustomerName: string;
  BillAmount: number;
  TransactionReference?: string;
  BillAmount?: number; // Added from getPaymentsByCustomer
  BillingPeriodEnd?: string; // Added from getPaymentsByCustomer
}

export const getAllPayments = async (): Promise<Payment[]> => {
  try {
    const response = await api.get("/payments");
    return response.data;
  } catch (error) {
    console.error("Error fetching all payments:", error);
    return [];
  }
};

export interface UnpaidBill {
  BillID: number;
  RemainingBalance: number;
  CustomerName: string;
  MeterNumber: string;
}

export const getUnpaidBills = async (): Promise<UnpaidBill[]> => {
  try {
    const response = await api.get("/bills/unpaid");
    return response.data;
  } catch (error) {
    console.error("Error fetching unpaid bills:", error);
    return [];
  }
};

export interface NewPaymentData {
  BillID: number;
  AmountPaid: number;
  PaymentMethod: string;
  ProcessedBy: string;
  TransactionRef?: string;
}

export const processPayment = async (data: NewPaymentData) => {
  try {
    const response = await api.post("/payments/process", data);
    return response.data;
  } catch (error) {
    console.error("Error processing payment:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Failed to process payment");
    }
    throw new Error("Failed to process payment");
  }
};

export const deletePayment = async (id: number) => {
  try {
    const response = await api.delete(`/payments/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting payment:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Failed to delete payment");
    }
    throw new Error("Failed to delete payment");
  }
};


// --- Tariff Data ---
export interface Tariff {
  TariffID: number;
  UtilityTypeID: number;
  PlanName: string;
  MinUnits: number;
  MaxUnits: number | null;
  RatePerUnit: number;
  FixedCharge: number;
  EffectiveFromDate: string;
  IsActive: boolean;
  UtilityName: string;
  Unit: string;
}

export type NewTariffData = Omit<Tariff, 'TariffID' | 'UtilityName' | 'Unit'>;
export type UpdateTariffData = Omit<Tariff, 'TariffID' | 'UtilityTypeID' | 'UtilityName' | 'Unit' | 'EffectiveFromDate'>;


export const getAllTariffs = async (): Promise<Tariff[]> => {
  try {
    const response = await api.get("/tariffs");
    return response.data;
  } catch (error) {
    console.error("Error fetching tariffs:", error);
    return [];
  }
};

export const createTariff = async (data: NewTariffData) => {
  try {
    const response = await api.post("/tariffs", data);
    return response.data;
  } catch (error) {
    console.error("Error creating tariff:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Failed to create tariff");
    }
    throw new Error("Failed to create tariff");
  }
};

export const updateTariff = async (id: number, data: UpdateTariffData) => {
  try {
    const response = await api.put(`/tariffs/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating tariff:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Failed to update tariff");
    }
    throw new Error("Failed to update tariff");
  }
};

export const deleteTariff = async (id: number) => {
  try {
    const response = await api.delete(`/tariffs/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting tariff:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Failed to delete tariff");
    }
    throw new Error("Failed to delete tariff");
  }
};

// --- Chart Data ---
export interface MonthlyRevenue {
  Year: number;
  Month: number;
  MonthName: string;
  UtilityName: string;
  TotalRevenue: number;
}

export interface TopConsumer {
  CustomerName: string;
  UtilityName:string;
  TotalConsumption: number;
}

export const getMonthlyRevenue = async (): Promise<MonthlyRevenue[]> => {
  try {
    const response = await api.get("/reports/monthly-revenue");
    return response.data;
  } catch (error) {
    console.error("Error fetching monthly revenue:", error);
    return [];
  }
};

export const getTopConsumers = async (): Promise<TopConsumer[]> => {
  try {
    const response = await api.get("/reports/top-consumers");
    return response.data;
  } catch (error) {
    console.error("Error fetching top consumers:", error);
    return [];
  }
};

// --- Reports Data ---
export interface RevenueReportRow {
  UtilityName: string;
  TotalTransactions: number;
  UniqueCustomers: number;
  TotalRevenue: number;
}

export const runRevenueByPeriodReport = async (StartDate: string, EndDate: string): Promise<RevenueReportRow[]> => {
  try {
    const response = await api.post("/reports/revenue-by-period", { StartDate, EndDate });
    return response.data;
  } catch (error) {
    console.error("Error running revenue report:", error);
    return [];
  }
};

export interface DefaulterReportRow {
  CustomerID: number;
  CustomerName: string;
  ContactNumber: string;
  TotalOutstanding: number;
  OverdueBills: number;
  MaxDaysOverdue: number;
}

export const runDefaultersReport = async (DaysOverdue: number): Promise<DefaulterReportRow[]> => {
  try {
    const response = await api.post("/reports/defaulters", { DaysOverdue });
    return response.data;
  } catch (error) {
    console.error("Error running defaulters report:", error);
    return [];
  }
};

// --- Activity Log Data ---
export interface ActivityLog {
  ActivityID: string;
  ActivityType: 'Payment' | 'Reading';
  ActivityDate: string;
  PerformedBy: string;
  Details: string;
  Amount: number | null;
}

export const getActivityLog = async (): Promise<ActivityLog[]> => {
  try {
    const response = await api.get("/reports/activity-log");
    return response.data;
  } catch (error) {
    console.error("Error fetching activity log:", error);
    return [];
  }
};

// --- NEW: Customer Details Page Functions ---

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  try {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  } catch (error) { 
    console.error("Error fetching customer by ID:", error); 
    return null; 
  }
};

export const getMetersByCustomer = async (id: string): Promise<Meter[]> => {
  try {
    const response = await api.get(`/meters/customer/${id}`);
    return response.data;
  } catch (error) { 
    console.error("Error fetching customer meters:", error); 
    return []; 
  }
};

// We can re-use the Bill interface
export const getBillsByCustomer = async (id: string): Promise<Bill[]> => {
  try {
    const response = await api.get(`/bills/customer/${id}`);
    return response.data;
  } catch (error) { 
    console.error("Error fetching customer bills:", error); 
    return []; 
  }
};

// We can re-use the Payment interface
export const getPaymentsByCustomer = async (id: string): Promise<Payment[]> => {
  try {
    const response = await api.get(`/payments/customer/${id}`);
    return response.data;
  } catch (error) { 
    console.error("Error fetching customer payments:", error); 
    return []; 
  }
};