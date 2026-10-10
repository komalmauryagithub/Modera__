import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Trust reverse proxies (Render, Railway, Heroku, Nginx) for accurate client IPs and rate limiting
app.set('trust proxy', 1);

// Configure CORS for production and local environments
const configuredClientUrls = (process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const defaultLocalOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:5000',
];

const allowedOrigins = [...new Set([...defaultLocalOrigins, ...configuredClientUrls])];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      // Check against explicit allowed origins
      const isAllowed = allowedOrigins.some((allowed) => {
        return origin === allowed || origin.endsWith(allowed.replace(/^https?:\/\//, ''));
      });

      if (isAllowed || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked: Origin ${origin} is not allowed.`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MEMORA API is healthy and operational.',
    tagline: 'Every Date Has a Story.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Root API information route
app.get('/api', (req, res) => {
  res.status(200).json({
    name: 'MEMORA Backend API',
    tagline: 'Every Date Has a Story.',
    version: '1.0.0',
    healthCheck: '/api/health',
    endpoints: {
      auth: '/api/auth',
      events: '/api/events',
    },
  });
});

// Mount Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

// Optional & Uploads static routing
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

const clientDistPath = path.resolve(__dirname, '../../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // If running in decoupled API-only mode
  app.get('/', (req, res) => {
    res.status(200).json({
      name: 'MEMORA Backend API',
      tagline: 'Every Date Has a Story.',
      status: 'Online',
      healthCheck: '/api/health',
    });
  });
}

// 404 & Centralized Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[MEMORA Server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

export default app;
