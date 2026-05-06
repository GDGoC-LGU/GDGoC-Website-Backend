import { Router } from 'express';
import {
  getPublicHallOfFame,
  getAllHallOfFame,
  getHallOfFameById,
  createHallOfFame,
  updateHallOfFame,
  deleteHallOfFame,
  setMemberOfMonth,
} from '../controllers/hallOfFameController.js';
import { protect } from '../middleware/auth.js';
import { uploadHallOfFame, handleMulterError } from '../middleware/upload.js';

const router = Router();

// ── Public ──────────────────────────────────────────────
// GET /api/hall-of-fame
router.get('/', getPublicHallOfFame);

// ── Admin ───────────────────────────────────────────────
// GET /api/admin/hall-of-fame
router.get('/admin', protect, getAllHallOfFame);

// GET /api/admin/hall-of-fame/:id
router.get('/admin/:id', protect, getHallOfFameById);

// POST /api/admin/hall-of-fame
router.post('/admin', protect, uploadHallOfFame.single('photo'), handleMulterError, createHallOfFame);

// PUT /api/admin/hall-of-fame/:id
router.put('/admin/:id', protect, uploadHallOfFame.single('photo'), handleMulterError, updateHallOfFame);

// DELETE /api/admin/hall-of-fame/:id
router.delete('/admin/:id', protect, deleteHallOfFame);

// PATCH /api/admin/hall-of-fame/:id/set-member-of-month
router.patch('/admin/:id/set-member-of-month', protect, setMemberOfMonth);

export default router;