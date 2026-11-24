import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
