import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
	res.json({ message: "Readings route root - list readings (placeholder)" });
});

router.get("/:id", (req, res) => {
	res.json({ message: `Get reading ${req.params.id} (placeholder)` });
});

export default router;
