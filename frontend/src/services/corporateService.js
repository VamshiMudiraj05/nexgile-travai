import api from './api';

export const corporateService = {
  // Corporate Accounts
  getCorporateAccounts: async (params = {}) => {
    const response = await api.get('/corporate/accounts', { params });
    return response.data;
  },

  getCorporateAccountById: async (id) => {
    const response = await api.get(`/corporate/accounts/${id}`);
    return response.data;
  },

  createCorporateAccount: async (payload) => {
    const response = await api.post('/corporate/accounts', payload);
    return response.data;
  },

  updateCorporateAccount: async (id, payload) => {
    const response = await api.put(`/corporate/accounts/${id}`, payload);
    return response.data;
  },

  verifyCorporateCode: async (code) => {
    const response = await api.get(`/corporate/verify/${code}`);
    return response.data;
  },

  // Group Blocks
  getGroupBlocks: async (params = {}) => {
    const response = await api.get('/corporate/group-blocks', { params });
    return response.data;
  },

  getGroupBlockById: async (id) => {
    const response = await api.get(`/corporate/group-blocks/${id}`);
    return response.data;
  },

  createGroupBlock: async (payload) => {
    const response = await api.post('/corporate/group-blocks', payload);
    return response.data;
  },

  releaseUnpickedRooms: async (blockId) => {
    const response = await api.post(`/corporate/group-blocks/${blockId}/release`);
    return response.data;
  },
};
