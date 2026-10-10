import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
export const uploadToCloudinary = (fileBuffer, folder = 'memora_events', fileMeta = {}) => {
  return new Promise((resolve, reject) => {
    // If mock credentials detected in dev/test, save file locally and return local URL
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const isMock =
      !apiKey ||
      apiKey === '123456789012345' ||
      apiKey === 'your_cloudinary_api_key' ||
      apiKey === 'your_api_key_here';

    if (isMock) {
      const ext = fileMeta?.mimetype
        ? (fileMeta.mimetype.includes('png') ? '.png' : fileMeta.mimetype.includes('webp') ? '.webp' : '.jpg')
        : '.jpg';
      const mockId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const fileName = `${mockId}${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      try {
        fs.writeFileSync(filePath, fileBuffer);
        const serverPort = process.env.PORT || 5000;
        const baseUrl = process.env.SERVER_BASE_URL || `http://localhost:${serverPort}`;
        return resolve({
          secure_url: `${baseUrl}/uploads/${fileName}`,
          public_id: `local_uploads/${mockId}`,
        });
      } catch (err) {
        console.error('[Local Upload Storage Error]', err);
        return resolve({
          secure_url: `http://localhost:5000/uploads/${fileName}`,
          public_id: `local_uploads/${mockId}`,
        });
      }
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
          { width: 1600, height: 1600, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary Upload Error]', error);
          return reject(new Error(error.message || 'Image upload to Cloudinary failed.'));
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete an image asset from Cloudinary or local storage by its public ID
 * @param {string} publicId - The Cloudinary public ID
 * @returns {Promise<any>}
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const isMock =
    !apiKey ||
    apiKey === '123456789012345' ||
    apiKey === 'your_cloudinary_api_key' ||
    apiKey === 'your_api_key_here' ||
    publicId.startsWith('local_uploads/');

  if (isMock) {
    try {
      const mockPrefix = publicId.replace('local_uploads/', '');
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file.startsWith(mockPrefix)) {
          fs.unlinkSync(path.join(uploadsDir, file));
        }
      }
    } catch {
      // Ignore local cleanup error
    }
    return { result: 'ok' };
  }

  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`[Cloudinary Destroy Error] Failed to delete image ${publicId}:`, error.message);
  }
};
