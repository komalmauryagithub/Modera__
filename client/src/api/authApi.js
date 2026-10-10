import axiosClient from './axiosClient';

/**
 * Authentication API Service
 */
export const authApi = {
  /**
   * Register a new user
   * @param {{ name: string, email: string, password: string }} userData
   */
  register: async (userData) => {
    const response = await axiosClient.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Login user
   * @param {{ email: string, password: string }} credentials
   */
  login: async (credentials) => {
    const response = await axiosClient.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Fetch current authenticated user profile
   */
  getMe: async () => {
    const response = await axiosClient.get('/auth/me');
    return response.data;
  },
};

export default authApi;
