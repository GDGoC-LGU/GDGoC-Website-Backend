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
// GET /api/team/admin
router.get('/admin', protect, getAllTeamMembers);

// PATCH /api/team/admin/reorder  (before /:id routes)
router.patch('/admin/reorder', protect, reorderTeam);

// GET /api/team/admin/:id
router.get('/admin/:id', protect, getTeamMemberById);

// POST /api/team/admin
router.post('/admin', protect, uploadTeam.single('image'), handleMulterError, createTeamMember);

// PUT /api/team/admin/:id
router.put('/admin/:id', protect, uploadTeam.single('image'), handleMulterError, updateTeamMember);

// DELETE /api/team/admin/:id
router.delete('/admin/:id', protect, deleteTeamMember);

export default router;