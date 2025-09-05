import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import Recording from '../models/Recording.js';

const router = express.Router();

// Disk storage (simple). For cloud storage, swap this with S3/Cloudinary later.
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, 'uploads/'),
  filename: (_, file, cb) => {
    const id = uuidv4();
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `${id}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 1024 * 1024 * 200 } }); // 200MB

// Helper to build absolute URL
const absoluteUrl = (req, filename) =>
  `${req.protocol}://${req.get('host')}/uploads/${filename}`;

// POST /api/recordings -> upload recording + metadata
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const title = req.body.title || 'Untitled';
    const { filename, size } = req.file;
    const url = absoluteUrl(req, filename);

    const rec = await Recording.create({ title, filename, size, url });
    return res.status(201).json({ message: 'Uploaded', recording: rec });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

// GET /api/recordings -> list
router.get('/', async (_req, res) => {
  const list = await Recording.findAll({ order: [['createdAt', 'DESC']] });
  res.json(list);
});

// GET /api/recordings/:id -> fetch/play
router.get('/:id', async (req, res) => {
  const rec = await Recording.findByPk(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Not found' });
  // Serve the actual file so <video src="/api/recordings/:id"> works
  res.redirect(rec.url);
});

export default router;
