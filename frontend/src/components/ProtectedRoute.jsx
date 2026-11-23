import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center text-[#13152C]">
        <div className="w-12 h-12 border-4 border-[#DFB76C]/30 border-t-[#B88E43] rounded-full animate-spin mb-4"></div>
        <p className="font-cinzel text-xs tracking-[0.2em] font-bold text-[#B88E43] uppercase">
          Verifying security credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
