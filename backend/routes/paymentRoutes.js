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

// Define roles
const isAdmin = authorize('Admin');
const isClerkOrAdmin = authorize('Admin', 'BillingClerk', 'Manager');

// A clerk or admin can process a payment
router.post("/process", protect, isClerkOrAdmin, processPayment);

// A clerk or admin can get payments for a customer
router.get("/customer/:id", protect, isClerkOrAdmin, getPaymentsByCustomer);

// A clerk or admin can see all payments
router.get("/", protect, isClerkOrAdmin, getAllPayments);

// Only an Admin can delete a payment
router.delete("/:id", protect, isAdmin, deletePayment); 

export default router;