import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

// 1. VIEW CUSTOMERS LIST (GET /)
// Allowed: Admin, Manager, FieldOfficer
// (Customers should NOT see the full list)
router.get(
  "/",
  protect,
  authorize("Admin", "Manager", "FieldOfficer"),
  getAllCustomers
);

// 2. VIEW SINGLE CUSTOMER (GET /:id)
// FIX: Added "Customer" to the list so they can view their own profile
router.get(
  "/:id",
  protect,
  authorize("Admin", "Manager", "FieldOfficer", "Customer"), 
  getCustomerById
);

// 3. ADD CUSTOMER (POST /)
// Allowed: Admin, Manager
router.post(
  "/",
  protect,
  authorize("Admin", "Manager"), 
  createCustomer
);

// 4. UPDATE CUSTOMER (PUT /:id)
// Allowed: Admin, Manager
router.put(
  "/:id",
  protect,
  authorize("Admin", "Manager"),
  updateCustomer
);

// 5. DELETE CUSTOMER (DELETE /:id)
// Allowed: Admin only
router.delete(
  "/:id",
  protect,
  authorize("Admin"),
  deleteCustomer
);

export default router;