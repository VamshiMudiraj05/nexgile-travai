import api from './api';

export const marketplaceService = {
  search: async (params = {}) => {
    const res = await api.get('/marketplace/search', { params });
    return res.data;
  },

  getPropertyDetails: async (propertyId, params = {}) => {
    const res = await api.get(`/marketplace/properties/${propertyId}`, { params });
    return res.data;
  },
};
