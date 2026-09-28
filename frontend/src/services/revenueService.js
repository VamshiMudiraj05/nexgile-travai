import api from './api';

export const revenueService = {
  getRecommendations: async (params = {}) => {
    const res = await api.get('/revenue/recommendations', { params });
    return res.data;
  },

  applyRecommendation: async (payload) => {
    const res = await api.post('/revenue/recommendations/apply', payload);
    return res.data;
  },
};
