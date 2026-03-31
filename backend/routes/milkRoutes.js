import express from "express";
import { addMilkEntry, getMilkEntries, getAllMilkEntries } from "../controllers/dailyEnter.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post('/add', authMiddleware, addMilkEntry);
router.get('/user/:userId', authMiddleware, getMilkEntries);
router.get('/all', authMiddleware, adminMiddleware, getAllMilkEntries);

export default router;