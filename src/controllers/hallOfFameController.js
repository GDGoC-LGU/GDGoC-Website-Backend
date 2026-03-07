import HallOfFame from '../models/HallOfFame.js';
import { deleteFile } from '../middleware/upload.js';

const withImageUrl = (entry, req) => {
  const obj = entry.toObject ? entry.toObject() : { ...entry };
  obj.photo = obj.photo ? `${req.protocol}://${req.get('host')}${obj.photo}` : null;
  return obj;
};

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

// GET /api/hall-of-fame  — returns memberOfMonth + legends
export const getPublicHallOfFame = async (req, res, next) => {
  try {
    const [memberOfMonth, legends] = await Promise.all([
      HallOfFame.findOne({ isMemberOfMonth: true, isActive: true }).sort({ updatedAt: -1 }).lean(),
      HallOfFame.find({ isMemberOfMonth: false, isActive: true }).sort({ order: 1, createdAt: -1 }).lean(),
    ]);

    const mapImage = (entry) => ({
      ...entry,
      photo: entry.photo ? `${req.protocol}://${req.get('host')}${entry.photo}` : null,
    });

    res.status(200).json({
      success: true,
      data: {
        memberOfMonth: memberOfMonth ? mapImage(memberOfMonth) : null,
        legends: legends.map(mapImage),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN ───────────────────────────────────────────────────────────────────

// GET /api/admin/hall-of-fame
export const getAllHallOfFame = async (req, res, next) => {
  try {
    const { type } = req.query; // ?type=member-of-month | legend | all
    const query = {};
    if (type === 'member-of-month') query.isMemberOfMonth = true;
    else if (type === 'legend') query.isMemberOfMonth = false;

    const entries = await HallOfFame.find(query).sort({ isMemberOfMonth: -1, order: 1, createdAt: -1 }).lean();
    const mapped = entries.map((e) => ({
      ...e,
      photo: e.photo ? `${req.protocol}://${req.get('host')}${e.photo}` : null,
    }));

    res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/hall-of-fame/:id
export const getHallOfFameById = async (req, res, next) => {
  try {
    const entry = await HallOfFame.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found.' });
    res.status(200).json({ success: true, data: withImageUrl(entry, req) });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/hall-of-fame
export const createHallOfFame = async (req, res, next) => {
  try {
    const { name, achievement, description, year, isMemberOfMonth, month, order, isActive } = req.body;

    if (!name || !achievement || !description) {
      if (req.file) deleteFile(`/uploads/halloffame/${req.file.filename}`);
      return res.status(400).json({ success: false, message: 'name, achievement, and description are required.' });
    }

    const isMOM = isMemberOfMonth === 'true' || isMemberOfMonth === true;

    // If setting as member of month, unset any previous one
    if (isMOM) {
      await HallOfFame.updateMany({ isMemberOfMonth: true }, { isMemberOfMonth: false });
    }

    const entry = await HallOfFame.create({
      name, achievement, description,
      year: year || null,
      isMemberOfMonth: isMOM,
      month: isMOM ? (month || null) : null,
      photo: req.file ? `/uploads/halloffame/${req.file.filename}` : null,
      order: order ? Number(order) : 0,
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
    });

    res.status(201).json({ success: true, message: 'Hall of Fame entry created.', data: withImageUrl(entry, req) });
  } catch (error) {
    if (req.file) deleteFile(`/uploads/halloffame/${req.file.filename}`);
    next(error);
  }
};

// PUT /api/admin/hall-of-fame/:id
export const updateHallOfFame = async (req, res, next) => {
  try {
    const entry = await HallOfFame.findById(req.params.id);
    if (!entry) {
      if (req.file) deleteFile(`/uploads/halloffame/${req.file.filename}`);
      return res.status(404).json({ success: false, message: 'Entry not found.' });
    }

    const { name, achievement, description, year, isMemberOfMonth, month, order, isActive } = req.body;

    if (req.file) {
      if (entry.photo) deleteFile(entry.photo);
      entry.photo = `/uploads/halloffame/${req.file.filename}`;
    }

    const isMOM = isMemberOfMonth === 'true' || isMemberOfMonth === true;

    // If promoting to member of month, demote others
    if (isMOM && !entry.isMemberOfMonth) {
      await HallOfFame.updateMany({ isMemberOfMonth: true, _id: { $ne: entry._id } }, { isMemberOfMonth: false });
    }

    if (name !== undefined)            entry.name = name;
    if (achievement !== undefined)     entry.achievement = achievement;
    if (description !== undefined)     entry.description = description;
    if (year !== undefined)            entry.year = year || null;
    if (isMemberOfMonth !== undefined) entry.isMemberOfMonth = isMOM;
    if (month !== undefined)           entry.month = month || null;
    if (order !== undefined)           entry.order = Number(order);
    if (isActive !== undefined)        entry.isActive = isActive === 'true' || isActive === true;

    await entry.save();
    res.status(200).json({ success: true, message: 'Entry updated.', data: withImageUrl(entry, req) });
  } catch (error) {
    if (req.file) deleteFile(`/uploads/halloffame/${req.file.filename}`);
    next(error);
  }
};

// DELETE /api/admin/hall-of-fame/:id
export const deleteHallOfFame = async (req, res, next) => {
  try {
    const entry = await HallOfFame.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found.' });

    if (entry.photo) deleteFile(entry.photo);
    await entry.deleteOne();

    res.status(200).json({ success: true, message: 'Entry deleted.' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/hall-of-fame/:id/set-member-of-month
export const setMemberOfMonth = async (req, res, next) => {
  try {
    const entry = await HallOfFame.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found.' });

    const { month } = req.body;

    // Demote old member of month
    await HallOfFame.updateMany({ isMemberOfMonth: true }, { isMemberOfMonth: false, month: null });

    entry.isMemberOfMonth = true;
    entry.month = month || entry.month;
    await entry.save();

    res.status(200).json({ success: true, message: `${entry.name} set as Member of the Month.`, data: withImageUrl(entry, req) });
  } catch (error) {
    next(error);
  }
};