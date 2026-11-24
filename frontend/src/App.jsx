import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { AppRoutes } from './routes/AppRoutes';
import api from './services/api';

export function App() {
  useEffect(() => {
    // Proactively ping backend health endpoint on initial load to warm up cold cloud containers
    api.get('/health').catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider>
          <AppRoutes />
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
