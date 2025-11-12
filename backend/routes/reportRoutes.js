import express from "express";
import {
  getDashboardStats,
  getMonthlyRevenue,
  getTopConsumers,
  getRevenueByPeriod,
  getDefaulters,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorize.js"; 

const router = express.Router();

// This is our new authorization gate
const isManager = authorize('Admin', 'Manager');

// 2. Add 'protect' and 'isManager' to all routes
router.get("/dashboard", protect, isManager, getDashboardStats);
router.get("/monthly-revenue", protect, isManager, getMonthlyRevenue);
router.get("/top-consumers", protect, isManager, getTopConsumers);
router.post("/revenue-by-period", protect, isManager, getRevenueByPeriod);
router.post("/defaulters", protect, isManager, getDefaulters);

export default router;