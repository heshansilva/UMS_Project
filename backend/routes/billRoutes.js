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

const router = express.Router();



// POST /api/bills/generate
router.post("/generate", generateBill);

// PUT /api/bills/update-status
router.put("/update-status", updateOverdueStatus);

// GET /api/bills/unbilled-readings
router.get("/unbilled-readings", getUnbilledReadings);

// GET /api/bills/unpaid
router.get("/unpaid", getUnpaidBills);

// GET /api/bills/customer/:customerId
router.get("/customer/:customerId", getBillsByCustomer);



// GET /api/bills
router.get("/", getAllBills);

// GET /api/bills/:id
router.get("/:id", getBillById);

export default router;