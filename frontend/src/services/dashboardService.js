import api from './api';

export const dashboardService = {
  getSummary: async (params = {}) => {
    const response = await api.get('/dashboard/summary', { params });
    return response.data;
  },
};
