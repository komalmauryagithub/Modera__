import cloudinary from '../config/cloudinary.js';

/**
 * Upload an image buffer to Cloudinary using upload_stream
 * @param {Buffer} fileBuffer - File buffer from multer memory storage
 * @param {string} folder - Target folder in Cloudinary
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export const uploadToCloudinary = (fileBuffer, folder = 'memora_events') => {
  return new Promise((resolve, reject) => {
    // If mock credentials detected in dev/test, return simulated upload response
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const isMock =
      !apiKey ||
      apiKey === '123456789012345' ||
      apiKey === 'your_cloudinary_api_key' ||
      apiKey === 'your_api_key_here';

    if (isMock) {
      const mockId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      return resolve({
        secure_url: `https://res.cloudinary.com/memora/image/upload/v1234567890/${folder}/${mockId}.webp`,
        public_id: `${folder}/${mockId}`,
      });
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
 * Delete an image asset from Cloudinary by its public ID
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
    apiKey === 'your_api_key_here';

  if (isMock) {
    return { result: 'ok' };
  }

  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`[Cloudinary Destroy Error] Failed to delete image ${publicId}:`, error.message);
  }
};
