import { Router } from 'express';
import { login, getMe, changePassword, createAdmin } from '../controllers/authController.js';
import { protect, superAdminOnly } from '../middleware/auth.js';

const router = Router();

router.post('/login',           login);
router.get('/me',                getMe);
router.patch('/change-password', protect, changePassword);
router.post('/create-admin',    protect, superAdminOnly, createAdmin);

export default router;