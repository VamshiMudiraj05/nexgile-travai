import api from './api';

export const propertyService = {
  getProperties: async (params = {}) => {
    const response = await api.get('/properties', { params });
    return response.data;
  },

  getPropertyById: async (id) => {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  },

  createProperty: async (data) => {
    const response = await api.post('/properties', data);
    return response.data;
  },

  onboardProperty: async (data) => {
    const response = await api.post('/properties/onboard', data);
    return response.data;
  },

  updateProperty: async (id, data) => {
    const response = await api.put(`/properties/${id}`, data);
    return response.data;
  },

  deleteProperty: async (id) => {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  },

  uploadStandaloneImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/properties/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadImage: async (propertyId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/properties/${propertyId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteImage: async (propertyId, publicId) => {
    const response = await api.delete(`/properties/${propertyId}/images`, {
      params: { public_id: publicId },
    });
    return response.data;
  },
};
