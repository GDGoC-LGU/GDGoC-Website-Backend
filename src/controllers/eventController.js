import Event from '../models/Event.js';
import { deleteFile } from '../middleware/upload.js';

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

// GET /api/events  — returns published events for frontend
export const getPublicEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ isPublished: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const mapped = events.map((e) => ({
      ...e,
      image: e.image ? `${req.protocol}://${req.get('host')}${e.image}` : null,
    }));

    res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN ───────────────────────────────────────────────────────────────────

// GET /api/admin/events  — all events (published + draft)
export const getAllEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [events, total] = await Promise.all([
      Event.find(query).sort({ order: 1, createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Event.countDocuments(query),
    ]);

    const mapped = events.map((e) => ({
      ...e,
      image: e.image ? `${req.protocol}://${req.get('host')}${e.image}` : null,
    }));

    res.status(200).json({
      success: true,
      count: mapped.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      page: Number(page),
      data: mapped,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/events/:id
export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    event.image = event.image ? `${req.protocol}://${req.get('host')}${event.image}` : null;
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/events
export const createEvent = async (req, res, next) => {
  try {
    const { title, description, venue, date, time, duration, registrationLink, isPublished, order } = req.body;

    if (!title || !description || !venue || !date || !time || !duration) {
      // Clean up uploaded file if validation fails
      if (req.file) deleteFile(`/uploads/events/${req.file.filename}`);
      return res.status(400).json({ success: false, message: 'title, description, venue, date, time, and duration are required.' });
    }

    const eventData = {
      title, description, venue, date, time, duration,
      registrationLink: registrationLink || null,
      isPublished: isPublished !== undefined ? isPublished === 'true' || isPublished === true : true,
      order: order ? Number(order) : 0,
      image: req.file ? `/uploads/events/${req.file.filename}` : null,
    };

    const event = await Event.create(eventData);
    event.image = event.image ? `${req.protocol}://${req.get('host')}${event.image}` : null;

    res.status(201).json({ success: true, message: 'Event created successfully.', data: event });
  } catch (error) {
    if (req.file) deleteFile(`/uploads/events/${req.file.filename}`);
    next(error);
  }
};

// PUT /api/admin/events/:id
export const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      if (req.file) deleteFile(`/uploads/events/${req.file.filename}`);
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const { title, description, venue, date, time, duration, registrationLink, isPublished, order } = req.body;

    // If new image uploaded, delete old one
    if (req.file) {
      if (event.image) deleteFile(event.image);
      event.image = `/uploads/events/${req.file.filename}`;
    }

    if (title !== undefined)       event.title = title;
    if (description !== undefined) event.description = description;
    if (venue !== undefined)       event.venue = venue;
    if (date !== undefined)        event.date = date;
    if (time !== undefined)        event.time = time;
    if (duration !== undefined)    event.duration = duration;
    if (registrationLink !== undefined) event.registrationLink = registrationLink || null;
    if (isPublished !== undefined) event.isPublished = isPublished === 'true' || isPublished === true;
    if (order !== undefined)       event.order = Number(order);

    await event.save();

    const result = event.toObject();
    result.image = result.image ? `${req.protocol}://${req.get('host')}${result.image}` : null;

    res.status(200).json({ success: true, message: 'Event updated successfully.', data: result });
  } catch (error) {
    if (req.file) deleteFile(`/uploads/events/${req.file.filename}`);
    next(error);
  }
};

// DELETE /api/admin/events/:id
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    if (event.image) deleteFile(event.image);
    await event.deleteOne();

    res.status(200).json({ success: true, message: 'Event deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/events/:id/toggle-publish
export const togglePublish = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    event.isPublished = !event.isPublished;
    await event.save();

    res.status(200).json({
      success: true,
      message: `Event ${event.isPublished ? 'published' : 'unpublished'} successfully.`,
      isPublished: event.isPublished,
    });
  } catch (error) {
    next(error);
  }
};