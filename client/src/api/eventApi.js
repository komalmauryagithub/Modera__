import axiosClient from './axiosClient';

/**
 * Event Management API Service
 */
export const eventApi = {
  /**
   * Get events with optional filters (month, search, category, startDate, endDate)
   * @param {Object} params
   */
  getEvents: async (params = {}) => {
    const response = await axiosClient.get('/events', { params });
    return response.data;
  },

  /**
   * Get upcoming events (today onwards)
   * @param {number} limit
   */
  getUpcomingEvents: async (limit = 10) => {
    const response = await axiosClient.get('/events/upcoming', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get a single event by ID
   * @param {string} id
   */
  getEventById: async (id) => {
    const response = await axiosClient.get(`/events/${id}`);
    return response.data;
  },

  /**
   * Create a new event (supports FormData with photo file or plain JSON)
   * @param {FormData|Object} data
   */
  createEvent: async (data) => {
    const isFormData = data instanceof FormData;
    const response = await axiosClient.post('/events', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  /**
   * Update an existing event
   * @param {string} id
   * @param {FormData|Object} data
   */
  updateEvent: async (id, data) => {
    const isFormData = data instanceof FormData;
    const response = await axiosClient.put(`/events/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  /**
   * Delete an event by ID
   * @param {string} id
   */
  deleteEvent: async (id) => {
    const response = await axiosClient.delete(`/events/${id}`);
    return response.data;
  },
};

export default eventApi;
