import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Auto-parse CLOUDINARY_URL if provided
if (process.env.CLOUDINARY_URL && (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME)) {
  try {
    const parsed = new URL(process.env.CLOUDINARY_URL.replace(/^cloudinary:\/\//, 'http://'));
    if (parsed.username) process.env.CLOUDINARY_API_KEY = parsed.username;
    if (parsed.password) process.env.CLOUDINARY_API_SECRET = parsed.password;
    if (parsed.hostname) process.env.CLOUDINARY_CLOUD_NAME = parsed.hostname;
  } catch (err) {
    console.error('Failed to parse CLOUDINARY_URL:', err.message);
  }
}

cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
  secure: true,
});

export default cloudinary;
