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

  chatStream: async (message, reservationId = null, history = [], onChunk, onDone) => {
    const token = localStorage.getItem('nexgile_auth_token') || localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const cleanBase = apiUrl.replace(/\/api\/v1\/?$/, '');
    const endpoint = `${cleanBase}/api/v1/concierge/chat/stream`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message,
        reservation_id: reservationId,
        history,
      }),
    });

    if (!response.ok) {
      throw new Error(`Streaming request failed: HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';

      for (const block of blocks) {
        const line = block.trim();
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6);
            const data = JSON.parse(jsonStr);
            if (data.token && onChunk) {
              onChunk(data.token);
            }
            if (data.done && onDone) {
              onDone(data);
            }
          } catch (err) {
            // Partial packet
          }
        }
      }
    }
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
