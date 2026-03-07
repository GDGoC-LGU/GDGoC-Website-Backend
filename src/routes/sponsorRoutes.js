import { Router } from 'express';
import {
  getPublicSponsors,
  getAllSponsors,
  getSponsorById,
  createSponsor,
  updateSponsor,
  deleteSponsor,
} from '../controllers/sponsorController.js';
import { protect } from '../middleware/auth.js';
import { uploadSponsor, handleMulterError } from '../middleware/upload.js';

const router = Router();

// ── Public ──────────────────────────────────────────────
// GET /api/sponsors
router.get('/', getPublicSponsors);

// ── Admin ───────────────────────────────────────────────
// GET /api/admin/sponsors
router.get('/admin', protect, getAllSponsors);

// GET /api/admin/sponsors/:id
router.get('/admin/:id', protect, getSponsorById);

// POST /api/admin/sponsors
router.post('/admin', protect, uploadSponsor.single('logo'), handleMulterError, createSponsor);

// PUT /api/admin/sponsors/:id
router.put('/admin/:id', protect, uploadSponsor.single('logo'), handleMulterError, updateSponsor);

// DELETE /api/admin/sponsors/:id
router.delete('/admin/:id', protect, deleteSponsor);

export default router;