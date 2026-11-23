import api from './api';

export const omnichannelService = {
  // Inbound Messaging & Dispatch
  inboundMessage: async (payload) => {
    const response = await api.post('/omnichannel/messages/inbound', payload);
    return response.data;
  },

  getMessages: async (statusFilter) => {
    const response = await api.get('/omnichannel/messages', {
      params: statusFilter ? { status: statusFilter } : {},
    });
    return response.data;
  },

  resolveMessage: async (msgId, actionData) => {
    const response = await api.post(`/omnichannel/messages/${msgId}/resolve`, actionData);
    return response.data;
  },

  // Post-Stay Survey & Sentiment
  submitSurvey: async (payload) => {
    const response = await api.post('/omnichannel/surveys', payload);
    return response.data;
  },

  getSentimentSummary: async (propertyId) => {
    const response = await api.get('/omnichannel/surveys/sentiment', {
      params: propertyId ? { property_id: propertyId } : {},
    });
    return response.data;
  },

  // Housekeeping Auto-Scheduler
  getOptimizedHousekeeping: async (propertyId = 'prop_101') => {
    const response = await api.get('/omnichannel/housekeeping/optimize', {
      params: { property_id: propertyId },
    });
    return response.data;
  },
};
