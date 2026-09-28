import api from './api';

export const loyaltyService = {
  getMyLoyalty: async () => {
    const res = await api.get('/loyalty/me');
    return res.data;
  },

  getTransactions: async (limit = 50) => {
    const res = await api.get('/loyalty/transactions', { params: { limit } });
    return res.data;
  },

  redeemPoints: async (payload) => {
    const res = await api.post('/loyalty/redeem', payload);
    return res.data;
  },
};
