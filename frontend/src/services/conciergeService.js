import api from './api';

export const conciergeService = {
  getWelcome: async () => {
    const res = await api.get('/concierge/welcome');
    return res.data;
  },

  chat: async (message, reservationId = null, history = []) => {
    const res = await api.post('/concierge/chat', {
      message,
      reservation_id: reservationId,
      history,
    });
    return res.data;
  },

  createServiceRequest: async (payload) => {
    const res = await api.post('/service-requests', payload);
    return res.data;
  },

  getMyRequests: async (reservationId = null) => {
    const res = await api.get('/service-requests', {
      params: reservationId ? { reservation_id: reservationId } : {},
    });
    return res.data;
  },
};
