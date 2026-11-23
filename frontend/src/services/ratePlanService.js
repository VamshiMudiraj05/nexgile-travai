import api from './api';

export const ratePlanService = {
  // Get all rate plans for property
  getRatePlans: async (params = {}) => {
    const response = await api.get('/rate-plans', { params });
    return response.data;
  },

  // Get single rate plan
  getRatePlanById: async (id) => {
    const response = await api.get(`/rate-plans/${id}`);
    return response.data;
  },

  // Create rate plan
  createRatePlan: async (payload) => {
    const response = await api.post('/rate-plans', payload);
    return response.data;
  },

  // Update rate plan or restrictions
  updateRatePlan: async (id, payload) => {
    const response = await api.put(`/rate-plans/${id}`, payload);
    return response.data;
  },

  // Delete rate plan
  deleteRatePlan: async (id) => {
    const response = await api.delete(`/rate-plans/${id}`);
    return response.data;
  },

  // Validate stay against rate plan restrictions
  validateStay: async (payload) => {
    const response = await api.post('/rate-plans/validate-stay', payload);
    return response.data;
  },
};
