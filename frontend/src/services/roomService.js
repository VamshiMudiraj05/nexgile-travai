import api from './api';

export const roomService = {
  getRooms: async (params = {}) => {
    const response = await api.get('/rooms', { params });
    return response.data;
  },

  getRoomsByProperty: async (propertyId, params = {}) => {
    const response = await api.get(`/properties/${propertyId}/rooms`, { params });
    return response.data;
  },

  getRoomById: async (id) => {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },

  createRoom: async (propertyId, data) => {
    const response = await api.post(`/properties/${propertyId}/rooms`, data);
    return response.data;
  },

  updateRoom: async (id, data) => {
    const response = await api.put(`/rooms/${id}`, data);
    return response.data;
  },

  updateRoomStatus: async (id, status, reason = '') => {
    const response = await api.patch(`/rooms/${id}/status`, { status, reason });
    return response.data;
  },

  deleteRoom: async (id) => {
    const response = await api.delete(`/rooms/${id}`);
    return response.data;
  },
};
