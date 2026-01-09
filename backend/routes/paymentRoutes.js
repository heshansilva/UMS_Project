import express from "express";
import {
  getAllPayments,
  getPaymentsByCustomer,
  processPayment,
  deletePayment, 
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js"; 
import { authorize } from "../middleware/authorize.js"; 

const router = express.Router();

// Role Definitions
const isAdmin = authorize('Admin');
const isClerkOrAdmin = authorize('Admin', 'BillingClerk', 'Manager');
// NEW: Allow Customers to view history
const canViewHistory = authorize('Admin', 'BillingClerk', 'Manager', 'Customer');

// A clerk or admin can process a payment
router.post("/process", protect, isClerkOrAdmin, processPayment);

// Updated: Added 'Customer' role via 'canViewHistory'
router.get("/customer/:id", protect, canViewHistory, getPaymentsByCustomer);

// A clerk or admin can see all payments
router.get("/", protect, isClerkOrAdmin, getAllPayments);

// Only an Admin can delete a payment
router.delete("/:id", protect, isAdmin, deletePayment); 

export default router;