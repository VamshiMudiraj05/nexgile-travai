import api from './api';

export const channelService = {
  // Channels
  getChannels: async () => {
    const response = await api.get('/channels');
    return response.data;
  },

  createChannel: async (payload) => {
    const response = await api.post('/channels', payload);
    return response.data;
  },

  updateChannel: async (channelId, payload) => {
    const response = await api.put(`/channels/${channelId}`, payload);
    return response.data;
  },

  // Mappings
  getMappings: async (params = {}) => {
    const response = await api.get('/channels/mappings', { params });
    return response.data;
  },

  createMapping: async (payload) => {
    const response = await api.post('/channels/mappings', payload);
    return response.data;
  },

  // Allotments
  getAllotments: async (params = {}) => {
    const response = await api.get('/channels/allotments', { params });
    return response.data;
  },

  setAllotment: async (payload) => {
    const response = await api.post('/channels/allotments', payload);
    return response.data;
  },

  // Real-Time ARI Sync
  triggerAriSync: async (params = {}) => {
    const response = await api.post('/channels/sync-ari', null, { params });
    return response.data;
  },

  getSyncLogs: async (params = {}) => {
    const response = await api.get('/channels/sync-logs', { params });
    return response.data;
  },

  // Rate Parity
  getRateParityReport: async (params = {}) => {
    const response = await api.get('/channels/rate-parity', { params });
    return response.data;
  },

  // Performance
  getChannelPerformance: async (params = {}) => {
    const response = await api.get('/channels/performance', { params });
    return response.data;
  },
};
