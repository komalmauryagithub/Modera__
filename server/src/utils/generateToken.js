import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT for the authenticated user ID.
 * @param {string} id - The MongoDB user ID
 * @returns {string} - Signed JWT string
 */
export const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined on the server.');
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};
