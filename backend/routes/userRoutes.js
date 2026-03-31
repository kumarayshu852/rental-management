import express from 'express';
import { getUsers, getUserById } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/get', authMiddleware, adminMiddleware, getUsers);
router.get('/:id', authMiddleware, getUserById);

export default router;