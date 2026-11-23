import api from './api';

export const folioService = {
  // Get all folios with optional filters
  getFolios: async (params = {}) => {
    const response = await api.get('/folios', { params });
    return response.data;
  },

  // Get a single folio by ID
  getFolioById: async (folioId) => {
    const response = await api.get(`/folios/${folioId}`);
    return response.data;
  },

  // Get or auto-instantiate folio for a reservation
  getFolioByReservation: async (reservationId) => {
    const response = await api.get(`/folios/reservation/${reservationId}`);
    return response.data;
  },

  // Post a room charge, dining fee, or incidental
  postCharge: async (folioId, chargeData) => {
    const response = await api.post(`/folios/${folioId}/charges`, chargeData);
    return response.data;
  },

  // Record a payment on the folio
  recordPayment: async (folioId, paymentData) => {
    const response = await api.post(`/folios/${folioId}/payments`, paymentData);
    return response.data;
  },

  // Generate official tax invoice
  generateInvoice: async (folioId) => {
    const response = await api.get(`/folios/${folioId}/invoice`);
    return response.data;
  },

  // Get list of 50+ supported global currencies with rates
  getCurrencies: async () => {
    const response = await api.get('/folios/currencies');
    return response.data;
  },

  // Real-time currency conversion
  convertCurrency: async (amount, fromCurrency, toCurrency) => {
    const response = await api.post('/folios/currencies/convert', {
      amount,
      from_currency: fromCurrency,
      to_currency: toCurrency,
    });
    return response.data;
  },
};
