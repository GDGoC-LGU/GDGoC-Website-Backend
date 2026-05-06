import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

import authRoutes       from './routes/authRoutes.js';
import eventRoutes      from './routes/eventRoutes.js';
import teamRoutes       from './routes/teamRoutes.js';
import hallOfFameRoutes from './routes/hallOfFameRoutes.js';
import sponsorRoutes    from './routes/sponsorRoutes.js';
import dashboardRoutes  from './routes/dashboardRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Connect to DB ───────────────────────────────────────────────────────────
connectDB();

const app = express();

// ─── Security & Logging ──────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true, legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // strict for auth
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' },
});

app.use(generalLimiter);

// ─── Body Parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static Files (uploaded images) ─────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GDCoC LGU API is running 🚀',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/events',        eventRoutes);
app.use('/api/team',          teamRoutes);
app.use('/api/hall-of-fame',  hallOfFameRoutes);
app.use('/api/sponsors',      sponsorRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);

// ─── 404 & Error Handling ────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 GDCoC LGU API running on port ${PORT}`);
  console.log(`   ENV:    ${process.env.NODE_ENV}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});