import express from 'express';
import { addBill, getUserBills, getAllBills, approveBill, fixDuplicateBills, deleteBill } from "../controllers/billController.js";
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import { getOverdueBills } from "../controllers/billController.js";

const router = express.Router();

router.post('/add', authMiddleware, adminMiddleware, addBill);
router.get('/all', authMiddleware, adminMiddleware, getAllBills);
router.get('/fix-duplicates', authMiddleware, adminMiddleware, fixDuplicateBills);
router.get('/user/:userId', authMiddleware, getUserBills);
router.patch('/approve/:billId', authMiddleware, adminMiddleware, approveBill);

// ✅ NAYA
router.delete('/delete/:billId', authMiddleware, adminMiddleware, deleteBill);
// ... existing routes ke saath
router.get('/overdue', authMiddleware, adminMiddleware, getOverdueBills);
export default router;