import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useHotelWebSocket
 * Real-time event bus hook for staff dashboards and traveler notifications.
 * Auto-connects to /ws/hotel-events and manages reconnects gracefully.
 */
export const useHotelWebSocket = ({ onEvent, enabled = true } = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      // Determine protocol and host based on current environment or VITE_API_URL
      const apiUrl = import.meta.env.VITE_API_URL || '';
      let wsUrl = '';

      if (apiUrl.startsWith('http')) {
        const url = new URL(apiUrl);
        const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${url.host}/ws/hotel-events`;
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        // In local development with Vite dev proxy or standard port 8000
        wsUrl = `${protocol}//${window.location.hostname}:8000/ws/hotel-events`;
      }

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        // Start periodic ping heartbeat to keep cloud proxy sockets alive
        const pingInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'PING' }));
          } else {
            clearInterval(pingInterval);
          }
        }, 25000);
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'PONG') return;

          setLastEvent(parsed);
          if (onEventRef.current) {
            onEventRef.current(parsed);
          }
        } catch (e) {
          console.debug('Received non-json ws message:', event.data);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        // Reconnect after 4s
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 4000);
      };

      socket.onerror = () => {
        socket.close();
      };
    } catch (err) {
      console.debug('WebSocket connection attempt caught error:', err);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    }
  }, [enabled]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(typeof message === 'string' ? message : JSON.stringify(message));
    }
  }, []);

  return { isConnected, lastEvent, send };
};

export default useHotelWebSocket;
