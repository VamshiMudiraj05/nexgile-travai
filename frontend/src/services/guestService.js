import api from './api';

export const guestService = {
  getGuests: async (params = {}) => {
    const response = await api.get('/guests', { params });
    return response.data;
  },

  getGuestById: async (id) => {
    const response = await api.get(`/guests/${id}`);
    return response.data;
  },

  createGuest: async (data) => {
    const response = await api.post('/guests', data);
    return response.data;
  },

  updateGuest: async (id, data) => {
    const response = await api.put(`/guests/${id}`, data);
    return response.data;
  },

  deleteGuest: async (id) => {
    const response = await api.delete(`/guests/${id}`);
    return response.data;
  },
};
