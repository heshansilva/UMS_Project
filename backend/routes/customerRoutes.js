import express from "express";
import {
  getAllCustomers,
  getCustomerById,
  createNewCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerTypes,
} from "../controllers/customerController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorize.js"; 

const router = express.Router();

// 2. Define our roles
const isAdmin = authorize('Admin');
const isClerkOrAdmin = authorize('Admin', 'BillingClerk', 'Manager');
router.get("/types", protect, isClerkOrAdmin, getCustomerTypes);

// 3. Apply the roles
router.route("/")
  .get(protect, isClerkOrAdmin, getAllCustomers) // Clerks can see all customers
  .post(protect, isAdmin, createNewCustomer); // Only Admin can create

router.route("/:id")
  .get(protect, isClerkOrAdmin, getCustomerById) // Clerks can see one customer
  .put(protect, isAdmin, updateCustomer) // Only Admin can update
  .delete(protect, isAdmin, deleteCustomer); // Only Admin can delete

export default router;