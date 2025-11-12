import express from "express";
import {
  getAllPayments,
  getPaymentsByCustomer,
  processPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

// This must be before '/:id' or any other dynamic routes
router.post("/process", processPayment);

// This must be before '/:id'
router.get("/customer/:id", getPaymentsByCustomer);

// /api/payments
router.get("/", getAllPayments);

export default router;