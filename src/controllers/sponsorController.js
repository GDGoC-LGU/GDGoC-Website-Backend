import Sponsor from '../models/Sponsor.js';
import { deleteFile } from '../middleware/upload.js';

const withImageUrl = (sponsor, req) => {
  const obj = sponsor.toObject ? sponsor.toObject() : { ...sponsor };
  obj.logo = obj.logo ? `${req.protocol}://${req.get('host')}${obj.logo}` : null;
  return obj;
};

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

// GET /api/sponsors  — grouped by tier for frontend
export const getPublicSponsors = async (req, res, next) => {
  try {
    const sponsors = await Sponsor.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();

    const mapImage = (s) => ({
      ...s,
      logo: s.logo ? `${req.protocol}://${req.get('host')}${s.logo}` : null,
    });

    const grouped = {
      platinum: sponsors.filter((s) => s.tier === 'platinum').map(mapImage),
      gold:     sponsors.filter((s) => s.tier === 'gold').map(mapImage),
      community: sponsors.filter((s) => s.tier === 'community').map(mapImage),
    };

    res.status(200).json({ success: true, data: grouped });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN ───────────────────────────────────────────────────────────────────

// GET /api/admin/sponsors
export const getAllSponsors = async (req, res, next) => {
  try {
    const { tier, active } = req.query;
    const query = {};
    if (tier) query.tier = tier;
    if (active !== undefined) query.isActive = active === 'true';

    const sponsors = await Sponsor.find(query).sort({ tier: 1, order: 1 }).lean();
    const mapped = sponsors.map((s) => ({
      ...s,
      logo: s.logo ? `${req.protocol}://${req.get('host')}${s.logo}` : null,
    }));

    res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/sponsors/:id
export const getSponsorById = async (req, res, next) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id);
    if (!sponsor) return res.status(404).json({ success: false, message: 'Sponsor not found.' });
    res.status(200).json({ success: true, data: withImageUrl(sponsor, req) });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/sponsors
export const createSponsor = async (req, res, next) => {
  try {
    const { name, url, tier, order, isActive } = req.body;

    if (!name || !tier) {
      if (req.file) deleteFile(`/uploads/sponsors/${req.file.filename}`);
      return res.status(400).json({ success: false, message: 'name and tier are required.' });
    }

    const validTiers = ['platinum', 'gold', 'community'];
    if (!validTiers.includes(tier)) {
      if (req.file) deleteFile(`/uploads/sponsors/${req.file.filename}`);
      return res.status(400).json({ success: false, message: 'tier must be platinum, gold, or community.' });
    }

    const sponsor = await Sponsor.create({
      name,
      url: url || '#',
      tier,
      logo: req.file ? `/uploads/sponsors/${req.file.filename}` : null,
      order: order ? Number(order) : 0,
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
    });

    res.status(201).json({ success: true, message: 'Sponsor created.', data: withImageUrl(sponsor, req) });
  } catch (error) {
    if (req.file) deleteFile(`/uploads/sponsors/${req.file.filename}`);
    next(error);
  }
};

// PUT /api/admin/sponsors/:id
export const updateSponsor = async (req, res, next) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id);
    if (!sponsor) {
      if (req.file) deleteFile(`/uploads/sponsors/${req.file.filename}`);
      return res.status(404).json({ success: false, message: 'Sponsor not found.' });
    }

    const { name, url, tier, order, isActive } = req.body;

    if (req.file) {
      if (sponsor.logo) deleteFile(sponsor.logo);
      sponsor.logo = `/uploads/sponsors/${req.file.filename}`;
    }

    if (name !== undefined)     sponsor.name = name;
    if (url !== undefined)      sponsor.url = url || '#';
    if (tier !== undefined)     sponsor.tier = tier;
    if (order !== undefined)    sponsor.order = Number(order);
    if (isActive !== undefined) sponsor.isActive = isActive === 'true' || isActive === true;

    await sponsor.save();
    res.status(200).json({ success: true, message: 'Sponsor updated.', data: withImageUrl(sponsor, req) });
  } catch (error) {
    if (req.file) deleteFile(`/uploads/sponsors/${req.file.filename}`);
    next(error);
  }
};

// DELETE /api/admin/sponsors/:id
export const deleteSponsor = async (req, res, next) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id);
    if (!sponsor) return res.status(404).json({ success: false, message: 'Sponsor not found.' });

    if (sponsor.logo) deleteFile(sponsor.logo);
    await sponsor.deleteOne();

    res.status(200).json({ success: true, message: 'Sponsor deleted.' });
  } catch (error) {
    next(error);
  }
};