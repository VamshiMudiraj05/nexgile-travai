import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('nexgile_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify user on initial load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('nexgile_token');
      if (storedToken) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);
          localStorage.setItem('nexgile_user', JSON.stringify(userData));
        } catch (error) {
          console.warn('Session expired or invalid token:', error?.response?.data?.detail || error.message);
          localStorage.removeItem('nexgile_token');
          localStorage.removeItem('nexgile_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authApi.login({ email, password });
    const { access_token, user: userData } = response;
    
    localStorage.setItem('nexgile_token', access_token);
    localStorage.setItem('nexgile_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (formData) => {
    const response = await authApi.register(formData);
    return response;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('nexgile_token');
    localStorage.removeItem('nexgile_user');
    setUser(null);
    setToken(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
