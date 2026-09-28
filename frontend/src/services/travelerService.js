import api from './api';

export const travelerService = {
  createBooking: async (bookingData) => {
    const res = await api.post('/traveler/bookings', bookingData);
    return res.data;
  },

  getMyTrips: async () => {
    const res = await api.get('/traveler/bookings');
    return res.data;
  },

  getTripDetail: async (reservationId) => {
    const res = await api.get(`/traveler/bookings/${reservationId}`);
    return res.data;
  },

  cancelBooking: async (reservationId, reason) => {
    const res = await api.post(`/traveler/bookings/${reservationId}/cancel`, null, {
      params: { reason },
    });
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get('/traveler/profile');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.put('/traveler/profile', data);
    return res.data;
  },

  getRecommendations: async () => {
    const res = await api.get('/traveler/recommendations');
    return res.data;
  },
};
