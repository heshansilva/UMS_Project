import express from "express";
import {
  getAllMeters,
  getMeterById,
  addNewReading,
  getMeterReadingHistory,
  getUtilityTypes,
  getMetersByCustomer,
} from "../controllers/meterController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route for adding a new reading
// This needs to be *before* the '/:id' route
router.post("/reading", protect, addNewReading);

// /api/meters
router.get("/", protect, getAllMeters);

// /api/meters/types
router.get("/types", protect, getUtilityTypes);

// /api/meters/customer/:id
router.get("/customer/:id", protect, getMetersByCustomer);
// /api/meters/:id
router.get("/:id", protect, getMeterById);

// /api/meters/:id/readings
router.get("/:id/readings", getMeterReadingHistory);

export default router;