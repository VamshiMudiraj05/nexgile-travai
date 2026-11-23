import api from './api';

export const multimodalService = {
  // Flight inventory search
  searchFlights: async (params = {}) => {
    const response = await api.get('/multimodal/flights/search', { params });
    return response.data;
  },

  // Car rental fleet search
  searchCars: async (params = {}) => {
    const response = await api.get('/multimodal/cars/search', { params });
    return response.data;
  },

  // Activities & experiences search
  searchActivities: async (params = {}) => {
    const response = await api.get('/multimodal/activities/search', { params });
    return response.data;
  },

  // Dynamic vacation packages search
  searchPackages: async (params = {}) => {
    const response = await api.get('/multimodal/packages/search', { params });
    return response.data;
  },

  // Unified Cart
  getCart: async () => {
    const response = await api.get('/multimodal/cart');
    return response.data;
  },

  addToCart: async (itemData) => {
    const response = await api.post('/multimodal/cart/items', itemData);
    return response.data;
  },

  removeFromCart: async (itemId) => {
    const response = await api.delete(`/multimodal/cart/items/${itemId}`);
    return response.data;
  },

  holdPrice: async () => {
    const response = await api.post('/multimodal/cart/hold');
    return response.data;
  },

  applyPromo: async (promoCode) => {
    const response = await api.post('/multimodal/cart/apply-promo', { promo_code: promoCode });
    return response.data;
  },

  checkout: async (checkoutData) => {
    const response = await api.post('/multimodal/cart/checkout', checkoutData);
    return response.data;
  },

  // Digital Voucher
  getVoucher: async (voucherCode) => {
    const response = await api.get(`/multimodal/vouchers/${voucherCode}`);
    return response.data;
  },

  // Disruption Handling
  resolveDisruption: async (payload) => {
    const response = await api.post('/multimodal/disruptions/resolve', payload);
    return response.data;
  },
};
