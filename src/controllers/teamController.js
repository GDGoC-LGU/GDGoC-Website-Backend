import TeamMember from '../models/TeamMember.js';
import { deleteFile } from '../middleware/upload.js';

const withImageUrl = (member, req) => {
  const obj = member.toObject ? member.toObject() : { ...member };
  obj.image = obj.image ? `${req.protocol}://${req.get('host')}${obj.image}` : null;
  return obj;
};

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

// GET /api/team
export const getPublicTeam = async (req, res, next) => {
  try {
    const members = await TeamMember.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const mapped = members.map((m) => ({
      ...m,
      image: m.image ? `${req.protocol}://${req.get('host')}${m.image}` : null,
    }));

    res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN ───────────────────────────────────────────────────────────────────

// GET /api/admin/team
export const getAllTeamMembers = async (req, res, next) => {
  try {
    const { search, active } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { role: { $regex: search, $options: 'i' } }];
    if (active !== undefined) query.isActive = active === 'true';

    const members = await TeamMember.find(query).sort({ order: 1, createdAt: 1 }).lean();
    const mapped = members.map((m) => ({
      ...m,
      image: m.image ? `${req.protocol}://${req.get('host')}${m.image}` : null,
    }));

    res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/team/:id
export const getTeamMemberById = async (req, res, next) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found.' });
    res.status(200).json({ success: true, data: withImageUrl(member, req) });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/team
export const createTeamMember = async (req, res, next) => {
  try {
    const { name, role, description, order, isActive, 'socials.linkedin': linkedin, 'socials.github': github, 'socials.twitter': twitter } = req.body;

    if (!name || !role || !description) {
      if (req.file) deleteFile(`/uploads/team/${req.file.filename}`);
      return res.status(400).json({ success: false, message: 'name, role, and description are required.' });
    }

    // Support both flat fields and nested JSON string
    let socials = { linkedin: '', github: '', twitter: '' };
    if (req.body.socials) {
      try { socials = { ...socials, ...JSON.parse(req.body.socials) }; } catch {}
    } else {
      socials = {
        linkedin: linkedin || '',
        github: github || '',
        twitter: twitter || '',
      };
    }

    const member = await TeamMember.create({
      name, role, description, socials,
      image: req.file ? `/uploads/team/${req.file.filename}` : null,
      order: order ? Number(order) : 0,
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
    });

    res.status(201).json({ success: true, message: 'Team member created.', data: withImageUrl(member, req) });
  } catch (error) {
    if (req.file) deleteFile(`/uploads/team/${req.file.filename}`);
    next(error);
  }
};

// PUT /api/admin/team/:id
export const updateTeamMember = async (req, res, next) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      if (req.file) deleteFile(`/uploads/team/${req.file.filename}`);
      return res.status(404).json({ success: false, message: 'Team member not found.' });
    }

    const { name, role, description, order, isActive, 'socials.linkedin': linkedin, 'socials.github': github, 'socials.twitter': twitter } = req.body;

    if (req.file) {
      if (member.image) deleteFile(member.image);
      member.image = `/uploads/team/${req.file.filename}`;
    }

    if (name !== undefined)        member.name = name;
    if (role !== undefined)        member.role = role;
    if (description !== undefined) member.description = description;
    if (order !== undefined)       member.order = Number(order);
    if (isActive !== undefined)    member.isActive = isActive === 'true' || isActive === true;

    // Handle social links
    if (req.body.socials) {
      try {
        const parsed = JSON.parse(req.body.socials);
        member.socials = { ...member.socials.toObject(), ...parsed };
      } catch {}
    } else {
      if (linkedin !== undefined) member.socials.linkedin = linkedin;
      if (github !== undefined)   member.socials.github = github;
      if (twitter !== undefined)  member.socials.twitter = twitter;
    }

    await member.save();
    res.status(200).json({ success: true, message: 'Team member updated.', data: withImageUrl(member, req) });
  } catch (error) {
    if (req.file) deleteFile(`/uploads/team/${req.file.filename}`);
    next(error);
  }
};

// DELETE /api/admin/team/:id
export const deleteTeamMember = async (req, res, next) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found.' });

    if (member.image) deleteFile(member.image);
    await member.deleteOne();

    res.status(200).json({ success: true, message: 'Team member deleted.' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/team/reorder   body: [{ id, order }]
export const reorderTeam = async (req, res, next) => {
  try {
    const { items } = req.body; // [{ id: '...', order: 0 }, ...]
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'items must be an array.' });
    }

    await Promise.all(items.map(({ id, order }) => TeamMember.findByIdAndUpdate(id, { order })));
    res.status(200).json({ success: true, message: 'Team order updated.' });
  } catch (error) {
    next(error);
  }
};