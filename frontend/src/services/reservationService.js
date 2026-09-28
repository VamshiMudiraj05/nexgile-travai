import api from './api';

export const reservationService = {
  getReservations: async (params = {}) => {
    const response = await api.get('/reservations', { params });
    return response.data;
  },

  getReservationById: async (id) => {
    const response = await api.get(`/reservations/${id}`);
    return response.data;
  },

  checkAvailability: async (params) => {
    const response = await api.get('/reservations/availability', { params });
    return response.data;
  },

  createReservation: async (data) => {
    const response = await api.post('/reservations', data);
    return response.data;
  },

  confirmReservation: async (id) => {
    const response = await api.post(`/reservations/${id}/confirm`);
    return response.data;
  },

  cancelReservation: async (id) => {
    const response = await api.post(`/reservations/${id}/cancel`);
    return response.data;
  },

  checkIn: async (id) => {
    const response = await api.post(`/reservations/${id}/check-in`);
    return response.data;
  },

  checkOut: async (id) => {
    const response = await api.post(`/reservations/${id}/check-out`);
    return response.data;
  },
};
