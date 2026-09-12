import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { loginUser, signupUser } from '../services/api';

const AuthContext = createContext(null);

const DEMO_ACCOUNTS = {
  FARMER: {
    email: 'farmer@gmail.com',
    password: 'farmer123',
    role: 'farmer',
    name: 'Sunil Wickramasinghe',
    title: 'Registered Farmer',
    district: 'Gampaha',
    farmer_id: '00000000-0000-0000-0000-000000000001',
    farm_id: 'farm-gampaha-01',
  },
  OFFICER: {
    email: 'officer@gmail.com',
    password: 'officer123',
    role: 'officer',
    name: 'Dr. Bandara Rajapaksha',
    title: 'Regional Agriculture Officer',
    province: 'Western Province',
    officer_id: '00000000-0000-0000-0000-000000000002',
    badge: 'AO-WP-2026',
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('agrinova_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const _persistUserSession = (userData, token, redirectTo) => {
    setUser(userData);
    localStorage.setItem('agrinova_user', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('agrinova_token', token);
      localStorage.setItem('sb-access-token', token);
    }
    if (userData.farmer_id || userData.id) {
      localStorage.setItem('agrishield_farmer_id', userData.farmer_id || userData.id);
      localStorage.setItem('user_id', userData.farmer_id || userData.id);
    }
    if (userData.farm_id) {
      localStorage.setItem('agrishield_farm_id', userData.farm_id);
    }
    if (userData.officer_id || (userData.role === 'officer' && userData.id)) {
      localStorage.setItem('officer_id', userData.officer_id || userData.id);
    }
    if (userData.preferred_language) {
      localStorage.setItem('preferred_language', userData.preferred_language);
    }
  };

  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      const res = await loginUser(cleanEmail, cleanPass);
      if (res && res.success && res.data?.user) {
        const { user: userData, token, redirectTo } = res.data;
        _persistUserSession(userData, token, redirectTo);
        return { success: true, user: userData, redirectTo: redirectTo || (userData.role === 'officer' ? '/officer' : '/farmer') };
      }
    } catch (apiErr) {
      // Check demo fallback if backend offline or special demo credentials
      if (cleanEmail === DEMO_ACCOUNTS.FARMER.email && cleanPass === DEMO_ACCOUNTS.FARMER.password) {
        const userData = DEMO_ACCOUNTS.FARMER;
        _persistUserSession(userData, 'demo-token-farmer', '/farmer');
        return { success: true, user: userData, redirectTo: '/farmer' };
      }
      if (cleanEmail === DEMO_ACCOUNTS.OFFICER.email && cleanPass === DEMO_ACCOUNTS.OFFICER.password) {
        const userData = DEMO_ACCOUNTS.OFFICER;
        _persistUserSession(userData, 'demo-token-officer', '/officer');
        return { success: true, user: userData, redirectTo: '/officer' };
      }

      return {
        success: false,
        error: apiErr.message || 'Invalid email or password. Please verify your credentials.',
      };
    }

    return {
      success: false,
      error: 'Unable to authenticate. Please check credentials or try again.',
    };
  };

  const signup = async (userData) => {
    try {
      const res = await signupUser(userData);
      if (res && res.success && res.data?.user) {
        const { user: createdUser, token, redirectTo } = res.data;
        _persistUserSession(createdUser, token, redirectTo);
        return {
          success: true,
          user: createdUser,
          redirectTo: redirectTo || (createdUser.role === 'officer' ? '/officer' : '/farmer'),
          message: res.message,
        };
      }
      return { success: false, error: res?.message || 'Registration failed.' };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Registration failed. Please check inputs and try again.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('agrinova_user');
    localStorage.removeItem('agrinova_token');
    localStorage.removeItem('sb-access-token');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, demoAccounts: DEMO_ACCOUNTS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
