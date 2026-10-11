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
import { syncLocalImagesToCloudinary } from './utils/cloudinaryHelper.js';
import cloudinary from './config/cloudinary.js';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

// Connect to MongoDB and sync images to Cloudinary
connectDB().then(() => {
  syncLocalImagesToCloudinary();
});

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

      // If no production CLIENT_URL configured, allow all origins
      if (!origin || isAllowed || configuredClientUrls.length === 0 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked: Origin ${origin} is not allowed.`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Route (supports both /api/health and /health)
app.get(['/api/health', '/health'], (req, res) => {
  const hasCloudName = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'demo_cloud');
  const hasApiKey = Boolean(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== '123456789012345');
  const hasApiSecret = Boolean(process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_API_SECRET !== 'sample_secret_key');
  const hasCloudinaryUrl = Boolean(process.env.CLOUDINARY_URL);

  res.status(200).json({
    success: true,
    message: 'MEMORA API is healthy and operational.',
    tagline: 'Every Date Has a Story.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cloudinary: {
      isConfigured: (hasCloudName && hasApiKey && hasApiSecret) || hasCloudinaryUrl,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || (hasCloudinaryUrl ? 'configured_via_url' : 'not_set'),
      hasApiKey,
      hasApiSecret,
      hasCloudinaryUrl,
    },
  });
});

// Cloudinary Live Diagnostic Endpoint
app.get('/api/test-cloudinary', async (req, res) => {
  try {
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim().replace(/^['"]|['"]$/g, '');
    const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim().replace(/^['"]|['"]$/g, '');

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'memora';
    const strToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

    const test1x1Pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const formData = new URLSearchParams();
    formData.append('file', test1x1Pixel);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('folder', folder);
    formData.append('signature', signature);

    const rawResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const status = rawResponse.status;
    const bodyText = await rawResponse.text();
    let bodyJson = null;
    try {
      bodyJson = JSON.parse(bodyText);
    } catch {}

    return res.status(status === 200 ? 200 : 400).json({
      success: status === 200,
      cloudinaryStatus: status,
      rawBody: bodyJson || bodyText,
      cloudName,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 4) + '...' : 'none',
      apiSecretLength: apiSecret ? apiSecret.length : 0,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
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

// Mount Application Routes (support both /api/auth and direct /auth, /api/events and direct /events)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/events', '/events'], eventRoutes);

// Optional & Uploads static routing
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

const clientDistPath = path.resolve(__dirname, '../../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
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
