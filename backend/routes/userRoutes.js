import express from 'express';
import { getUsers, getUserById } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import { updatePhone ,updateUser,deleteUser} from '../controllers/userController.js';

const router = express.Router();

router.get('/get', authMiddleware, adminMiddleware, getUsers);
router.get('/:id', authMiddleware, getUserById);
router.patch('/phone/:id', authMiddleware, adminMiddleware, updatePhone);

router.put('/update/:id', authMiddleware, adminMiddleware, updateUser);
router.delete('/delete/:id', authMiddleware, adminMiddleware, deleteUser);

export default router;