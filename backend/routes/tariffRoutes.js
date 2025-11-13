import express from "express";
import {
  getAllTariffs,
  createTariff,
  updateTariff,
  deleteTariff,
} from "../controllers/tariffController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();
const isAdmin = authorize('Admin');

// /api/tariffs
router.route("/")
  .get(protect, isAdmin, getAllTariffs)
  .post(protect, isAdmin, createTariff);

// /api/tariffs/:id
router.route("/:id")
  .put(protect, isAdmin, updateTariff)
  .delete(protect, isAdmin, deleteTariff);

export default router;