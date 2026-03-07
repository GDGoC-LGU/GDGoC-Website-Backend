import { Router } from 'express';
import {
  getPublicTeam,
  getAllTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  reorderTeam,
} from '../controllers/teamController.js';
import { protect } from '../middleware/auth.js';
import { uploadTeam, handleMulterError } from '../middleware/upload.js';

const router = Router();

// ── Public ──────────────────────────────────────────────
// GET /api/team
router.get('/', getPublicTeam);

// ── Admin ───────────────────────────────────────────────
// GET /api/admin/team
router.get('/admin', protect, getAllTeamMembers);

// PATCH /api/admin/team/reorder  (before /:id routes)
router.patch('/admin/reorder', protect, reorderTeam);

// GET /api/admin/team/:id
router.get('/admin/:id', protect, getTeamMemberById);

// POST /api/admin/team
router.post('/admin', protect, uploadTeam.single('image'), handleMulterError, createTeamMember);

// PUT /api/admin/team/:id
router.put('/admin/:id', protect, uploadTeam.single('image'), handleMulterError, updateTeamMember);

// DELETE /api/admin/team/:id
router.delete('/admin/:id', protect, deleteTeamMember);

export default router;