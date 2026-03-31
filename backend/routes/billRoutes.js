import express from 'express';
import { addBill, getUserBills, getAllBills, approveBill, fixDuplicateBills, deleteBill } from "../controllers/billController.js";
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

router.post('/add', authMiddleware, adminMiddleware, addBill);
router.get('/all', authMiddleware, adminMiddleware, getAllBills);
router.get('/fix-duplicates', authMiddleware, adminMiddleware, fixDuplicateBills);
router.get('/user/:userId', authMiddleware, getUserBills);
router.patch('/approve/:billId', authMiddleware, adminMiddleware, approveBill);

// ✅ NAYA
router.delete('/delete/:billId', authMiddleware, adminMiddleware, deleteBill);

export default router;