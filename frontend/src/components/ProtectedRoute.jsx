import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to={`/login?role=${requiredRole || 'farmer'}`} state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // If an officer tries to go to a farmer-only restricted route or farmer tries to go to officer console
    if (requiredRole === 'officer') {
      return <Navigate to="/login?role=officer" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
