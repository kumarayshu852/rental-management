import express from 'express';
import { addBill, getUserBills, getAllBills, approveBill, fixDuplicateBills } from "../controllers/billController.js";
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

// Admin — bill banao
router.post('/add', authMiddleware, adminMiddleware, addBill);

// Admin — sab users ke bills
router.get('/all', authMiddleware, adminMiddleware, getAllBills);

// ✅ Purane duplicate bills ek baar fix karo (admin only)
router.get('/fix-duplicates', authMiddleware, adminMiddleware, fixDuplicateBills);

// Kisi user ki bills
router.get('/user/:userId', authMiddleware, getUserBills);

// Admin — payment approve
router.patch('/approve/:billId', authMiddleware, adminMiddleware, approveBill);

export default router;