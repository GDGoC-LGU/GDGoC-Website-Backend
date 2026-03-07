import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];

const createStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads', folder);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${folder}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP, SVG) are allowed.'), false);
  }
};

const maxSize = (process.env.MAX_FILE_SIZE || 5) * 1024 * 1024; // default 5 MB

export const uploadEvent    = multer({ storage: createStorage('events'),     fileFilter, limits: { fileSize: maxSize } });
export const uploadTeam     = multer({ storage: createStorage('team'),       fileFilter, limits: { fileSize: maxSize } });
export const uploadHallOfFame = multer({ storage: createStorage('halloffame'), fileFilter, limits: { fileSize: maxSize } });
export const uploadSponsor  = multer({ storage: createStorage('sponsors'),   fileFilter, limits: { fileSize: maxSize } });

// Helper: delete old image file from disk
export const deleteFile = (filePath) => {
  if (!filePath) return;
  const fullPath = path.join(__dirname, '../../', filePath);
  fs.unlink(fullPath, (err) => {
    if (err && err.code !== 'ENOENT') console.warn('Could not delete file:', fullPath);
  });
};

// Multer error handler middleware
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: `File too large. Max size is ${process.env.MAX_FILE_SIZE || 5}MB.` });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};