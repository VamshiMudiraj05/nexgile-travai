import api from './api';

export const analyticsService = {
  getDashboardOverview: async () => {
    const res = await api.get('/dashboard/overview');
    return res.data;
  },

  getRevenueAnalytics: async (params = {}) => {
    const res = await api.get('/analytics/revenue', { params });
    return res.data;
  },

  getOccupancyAnalytics: async (params = {}) => {
    const res = await api.get('/analytics/occupancy', { params });
    return res.data;
  },

  getBookingAnalytics: async (params = {}) => {
    const res = await api.get('/analytics/bookings', { params });
    return res.data;
  },

  getForecast: async (params = {}) => {
    const res = await api.get('/analytics/forecast', { params });
    return res.data;
  },
};
