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
    if (user.role === 'officer') return <Navigate to="/officer" replace />;
    if (user.role === 'lab') return <Navigate to="/lab" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/farmer" replace />;
  }

  return children;
}
