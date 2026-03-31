import express from "express";
import { addMilkEntry, getMilkEntries, getAllMilkEntries, deleteMilkEntry } from "../controllers/dailyEnter.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post('/add', authMiddleware, addMilkEntry);
router.get('/user/:userId', authMiddleware, getMilkEntries);
router.get('/all', authMiddleware, adminMiddleware, getAllMilkEntries);

// ✅ NAYA
router.delete('/delete/:id', authMiddleware, adminMiddleware, deleteMilkEntry);

export default router;