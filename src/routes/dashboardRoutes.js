import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import Event from '../models/Event.js';
import TeamMember from '../models/TeamMember.js';
import HallOfFame from '../models/HallOfFame.js';
import Sponsor from '../models/Sponsor.js';

const router = Router();

// GET /api/admin/dashboard  — quick stats for admin dashboard home
router.get('/', protect, async (req, res, next) => {
  try {
    const [
      totalEvents, publishedEvents,
      totalTeam, activeTeam,
      totalHoF,
      totalSponsors,
    ] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ isPublished: true }),
      TeamMember.countDocuments(),
      TeamMember.countDocuments({ isActive: true }),
      HallOfFame.countDocuments(),
      Sponsor.countDocuments({ isActive: true }),
    ]);

    const recentEvents = await Event.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title date isPublished createdAt')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        events:  { total: totalEvents, published: publishedEvents, draft: totalEvents - publishedEvents },
        team:    { total: totalTeam, active: activeTeam },
        hallOfFame: { total: totalHoF },
        sponsors:  { total: totalSponsors },
        recentEvents,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;