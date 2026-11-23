import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

export const AuthContext = createContext(null);

const sanitizeUserData = (userData) => {
  if (!userData) return userData;
  const cleanName = userData.name
    ? userData.name.replace(/\s*\(.*?\)\s*/g, '').trim() || userData.name
    : userData.name;
  return { ...userData, name: cleanName };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('nexgile_user');
      return stored ? sanitizeUserData(JSON.parse(stored)) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('nexgile_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify user on initial load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('nexgile_token');
      if (storedToken) {
        try {
          const rawUser = await authApi.getMe();
          const cleanUser = sanitizeUserData(rawUser);
          setUser(cleanUser);
          localStorage.setItem('nexgile_user', JSON.stringify(cleanUser));
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
    const { access_token, user: rawUser } = response;
    const cleanUser = sanitizeUserData(rawUser);
    
    localStorage.setItem('nexgile_token', access_token);
    localStorage.setItem('nexgile_user', JSON.stringify(cleanUser));
    setToken(access_token);
    setUser(cleanUser);
    return cleanUser;
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
