import api from './api';

export const paymentService = {
  getPaymentConfig: async () => {
    const res = await api.get('/payments/config');
    return res.data;
  },

  createPayPalOrder: async (orderData) => {
    const res = await api.post('/payments/paypal/create-order', orderData);
    return res.data;
  },

  capturePayPalOrder: async (captureData) => {
    const res = await api.post('/payments/paypal/capture-order', captureData);
    return res.data;
  },
};
