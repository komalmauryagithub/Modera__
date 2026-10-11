import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import cloudinary from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

// Ensure local uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Upload an image buffer to Cloudinary using upload_stream (or local storage if mock)
 * @param {Buffer} fileBuffer - File buffer from multer memory storage
 * @param {string} folder - Target folder in Cloudinary
 * @param {object} fileMeta - Metadata including mimetype
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export const uploadToCloudinary = (fileBuffer, folder = 'memora', fileMeta = {}) => {
  return new Promise((resolve, reject) => {
    // Auto-parse CLOUDINARY_URL if present
    if (process.env.CLOUDINARY_URL) {
      try {
        const parsed = new URL(process.env.CLOUDINARY_URL.replace(/^cloudinary:\/\//, 'http://'));
        if (parsed.username) process.env.CLOUDINARY_API_KEY = parsed.username;
        if (parsed.password) process.env.CLOUDINARY_API_SECRET = parsed.password;
        if (parsed.hostname) process.env.CLOUDINARY_CLOUD_NAME = parsed.hostname;
      } catch {}
    }

    // Clean whitespace/quotes
    const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim().replace(/^['"]|['"]$/g, '');
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim().replace(/^['"]|['"]$/g, '');

    const isMock =
      !apiKey ||
      !cloudName ||
      !apiSecret ||
      apiKey === '123456789012345' ||
      apiKey === 'your_cloudinary_api_key' ||
      apiKey === 'your_api_key_here' ||
      cloudName === 'demo_cloud' ||
      cloudName === 'your_cloud_name';

    const saveLocally = () => {
      try {
        const ext = fileMeta?.mimetype
          ? (fileMeta.mimetype.includes('png') ? '.png' : fileMeta.mimetype.includes('webp') ? '.webp' : '.jpg')
          : '.jpg';
        const mockId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const fileName = `${mockId}${ext}`;

        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, fileBuffer);

        // Smart public base URL resolution (supports Render HTTPS external URL)
        let baseUrl =
          process.env.RENDER_EXTERNAL_URL ||
          process.env.SERVER_BASE_URL ||
          `http://localhost:${process.env.PORT || 5000}`;
        baseUrl = baseUrl.replace(/\/+$/, '');

        return resolve({
          secure_url: `${baseUrl}/uploads/${fileName}`,
          public_id: `local_uploads/${mockId}`,
        });
      } catch (err) {
        console.error('[Local Storage Error]', err);
        return reject(new Error('Failed to save image locally.'));
      }
    };

    if (isMock) {
      return saveLocally();
    }

    // Ensure Cloudinary SDK is initialized with latest credentials
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    console.log(`[Cloudinary Upload] Initiating upload to folder: "${folder}" using cloud: "${cloudName}"`);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        transformation: [
          { width: 1600, height: 1600, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary Upload Error]', error);
          console.warn('[Upload Fallback] Cloudinary stream failed, falling back to local file storage.');
          return saveLocally();
        }
        console.log(`[Cloudinary Upload Success] Saved to: ${result.secure_url}`);
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Auto-sync existing local mock uploads to Cloudinary when credentials become active
 */
export const syncLocalImagesToCloudinary = async () => {
  const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim().replace(/^['"]|['"]$/g, '');
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim().replace(/^['"]|['"]$/g, '');

  if (!apiKey || apiKey === '123456789012345' || !cloudName || !apiSecret) {
    return;
  }

  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const Event = (await import('../models/Event.js')).default;
    const mockEvents = await Event.find({
      imageUrl: { $regex: '/uploads/mock_' },
    });

    for (const ev of mockEvents) {
      try {
        console.log(`[Cloudinary Auto-Sync] Uploading "${ev.title}" to Cloudinary memora folder...`);
        const result = await cloudinary.uploader.upload(ev.imageUrl, {
          folder: 'memora',
          resource_type: 'auto',
        });
        ev.imageUrl = result.secure_url;
        ev.imagePublicId = result.public_id;
        await ev.save();
        console.log(`[Cloudinary Auto-Sync Success] "${ev.title}" moved to Cloudinary: ${result.secure_url}`);
      } catch (err) {
        console.warn(`[Cloudinary Auto-Sync Warning] Could not sync "${ev.title}":`, err.message);
      }
    }
  } catch (err) {
    console.error('[Cloudinary Auto-Sync Error]', err.message);
  }
};

/**
 * Delete an image asset from Cloudinary or local storage by its public ID
 * @param {string} publicId - The Cloudinary public ID
 * @returns {Promise<any>}
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return { result: 'ok' };

  try {
    // Local storage cleanup
    if (publicId.startsWith('local_uploads/')) {
      const mockPrefix = publicId.replace('local_uploads/', '');
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        for (const file of files) {
          if (file.startsWith(mockPrefix)) {
            try {
              fs.unlinkSync(path.join(uploadsDir, file));
            } catch {
              // Ignore individual unlink errors
            }
          }
        }
      }
      return { result: 'ok' };
    }

    const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim().replace(/^['"]|['"]$/g, '');
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim().replace(/^['"]|['"]$/g, '');
    const isMock =
      !apiKey ||
      !cloudName ||
      !apiSecret ||
      apiKey === '123456789012345' ||
      apiKey === 'your_cloudinary_api_key' ||
      apiKey === 'your_api_key_here' ||
      cloudName === 'demo_cloud' ||
      cloudName === 'your_cloud_name';

    if (isMock) {
      return { result: 'ok' };
    }

    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`[Cloudinary Destroy Safe Warning] Failed to delete image ${publicId}:`, error.message);
    return { result: 'ok' };
  }
};
