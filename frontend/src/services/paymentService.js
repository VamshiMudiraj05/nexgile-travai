import api from './api';

export const paymentService = {
  getPaymentConfig: async () => {
    const res = await api.get('/payments/config');
    return res.data;
  },

  getCreditPackages: async () => {
    const res = await api.get('/payments/packages');
    return res.data;
  },

  // Razorpay Gateway
  createRazorpayOrder: async (orderData) => {
    const res = await api.post('/payments/razorpay/create-order', orderData);
    return res.data;
  },

  verifyRazorpayPayment: async (verifyData) => {
    const res = await api.post('/payments/razorpay/verify', verifyData);
    return res.data;
  },

  // PayPal Gateway
  createPayPalOrder: async (orderData) => {
    const res = await api.post('/payments/paypal/create-order', orderData);
    return res.data;
  },

  capturePayPalOrder: async (captureData) => {
    const res = await api.post('/payments/paypal/capture-order', captureData);
    return res.data;
  },

  // Dynamic loader for Razorpay Checkout script
  loadRazorpayScript: () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },
};
