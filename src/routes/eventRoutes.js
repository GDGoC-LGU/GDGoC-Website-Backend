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
// GET /api/events/admin
router.get('/admin', protect, getAllEvents);

// GET /api/events/admin/:id
router.get('/admin/:id', protect, getEventById);

// POST /api/events/admin
router.post('/admin', protect, uploadEvent.single('image'), handleMulterError, createEvent);

// PUT /api/events/admin/:id
router.put('/admin/:id', protect, uploadEvent.single('image'), handleMulterError, updateEvent);

// DELETE /api/events/admin/:id
router.delete('/admin/:id', protect, deleteEvent);

// PATCH /api/events/admin/:id/toggle-publish
router.patch('/admin/:id/toggle-publish', protect, togglePublish);

export default router;