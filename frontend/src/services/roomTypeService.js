import api from './api';

export const roomTypeService = {
  getRoomTypesByProperty: async (propertyId) => {
    const response = await api.get(`/properties/${propertyId}/room-types`);
    return response.data;
  },

  getRoomTypeById: async (id) => {
    const response = await api.get(`/room-types/${id}`);
    return response.data;
  },

  createRoomType: async (propertyId, data) => {
    const response = await api.post(`/properties/${propertyId}/room-types`, data);
    return response.data;
  },

  updateRoomType: async (id, data) => {
    const response = await api.put(`/room-types/${id}`, data);
    return response.data;
  },

  deleteRoomType: async (id) => {
    const response = await api.delete(`/room-types/${id}`);
    return response.data;
  },

  uploadImage: async (roomTypeId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/room-types/${roomTypeId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteImage: async (roomTypeId, publicId) => {
    const response = await api.delete(`/room-types/${roomTypeId}/images`, {
      params: { public_id: publicId },
    });
    return response.data;
  },
};
