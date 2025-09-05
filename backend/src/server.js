import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import sequelize from './db.js';
import Recording from './models/Recording.js';
import recordingsRouter from './routes/recordings.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middlewares
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Static serving for uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API routes
app.use('/api/recordings', recordingsRouter);

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Start
(async () => {
  try {
    await sequelize.authenticate();
    await Recording.sync(); // auto-create table if not exists
    app.listen(PORT, () => console.log(`Backend listening on :${PORT}`));
  } catch (e) {
    console.error('Failed to start server', e);
    process.exit(1);
  }
})();
