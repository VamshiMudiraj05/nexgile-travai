import api from './api';

export const superappService = {
  // Digital Wallet
  getWallet: async () => {
    const response = await api.get('/superapp/wallet');
    return response.data;
  },

  topUpWallet: async (amount, paymentMethod = 'APPLE_PAY') => {
    const response = await api.post('/superapp/wallet/top-up', {
      amount,
      payment_method: paymentMethod,
    });
    return response.data;
  },

  convertPoints: async (pointsToConvert) => {
    const response = await api.post('/superapp/wallet/convert-points', {
      points_to_convert: pointsToConvert,
    });
    return response.data;
  },

  // Travel Vault
  getVault: async () => {
    const response = await api.get('/superapp/vault');
    return response.data;
  },

  addVaultDoc: async (docData) => {
    const response = await api.post('/superapp/vault', docData);
    return response.data;
  },

  // i18n
  getLanguages: async () => {
    const response = await api.get('/superapp/i18n/languages');
    return response.data;
  },

  getTranslations: async (locale = 'en') => {
    const response = await api.get(`/superapp/i18n/translations/${locale}`);
    return response.data;
  },

  // Multi-Tenancy
  getTenants: async () => {
    const response = await api.get('/superapp/tenants');
    return response.data;
  },

  createTenant: async (tenantData) => {
    const response = await api.post('/superapp/tenants', tenantData);
    return response.data;
  },
};
