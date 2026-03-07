import { Router } from 'express';
import {
  getPublicEvents,
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  togglePublish,
} from '../controllers/eventController.js';
import { protect } from '../middleware/auth.js';
import { uploadEvent, handleMulterError } from '../middleware/upload.js';

const router = Router();

// ── Public ──────────────────────────────────────────────
// GET /api/events
router.get('/', getPublicEvents);

// ── Admin ───────────────────────────────────────────────
// GET /api/admin/events
router.get('/admin', protect, getAllEvents);

// GET /api/admin/events/:id
router.get('/admin/:id', protect, getEventById);

// POST /api/admin/events
router.post('/admin', protect, uploadEvent.single('image'), handleMulterError, createEvent);

// PUT /api/admin/events/:id
router.put('/admin/:id', protect, uploadEvent.single('image'), handleMulterError, updateEvent);

// DELETE /api/admin/events/:id
router.delete('/admin/:id', protect, deleteEvent);

// PATCH /api/admin/events/:id/toggle-publish
router.patch('/admin/:id/toggle-publish', protect, togglePublish);

export default router;