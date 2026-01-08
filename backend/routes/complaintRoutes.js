import express from "express";
import {
  getAllComplaints,
  getComplaintById,
  createComplaint,
  updateComplaintStatus,
} from "../controllers/complaintController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

// Define roles
const isAdmin = authorize('Admin');
const isStaff = authorize('Admin', 'Manager', 'BillingClerk'); // Staff can view/create

// Routes
router.route("/")
  .get(protect, isStaff, getAllComplaints)
  .post(protect, isStaff, createComplaint);

router.route("/:id")
  .get(protect, isStaff, getComplaintById)
  .put(protect, isAdmin, updateComplaintStatus); // Only Admin can resolve/close per requirements

export default router;