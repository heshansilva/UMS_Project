import express from "express";
// 1. Change the import to bring in 'authUser'
import { registerUser, authUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
// 2. Change this line to use 'authUser'
router.post("/login", authUser);

export default router;