import express from "express";
import {
  getAllBills,
  getBillById,
  getBillsByCustomer,
  generateBill,
  updateOverdueStatus,
  getUnbilledReadings,
  getUnpaidBills,
} from "../controllers/billController.js";
import { protect } from "../middleware/authMiddleware.js"; // <--- THIS IS CRITICAL

const router = express.Router();

router.post("/generate", protect, generateBill);
router.put("/update-status", protect, updateOverdueStatus);
router.get("/unbilled-readings", protect, getUnbilledReadings);
router.get("/unpaid", protect, getUnpaidBills);
router.get("/customer/:customerId", protect, getBillsByCustomer);
router.get("/", protect, getAllBills);
router.get("/:id", protect, getBillById);

export default router;