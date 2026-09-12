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
  LAB: {
    email: 'lab@gmail.com',
    password: 'lab123',
    role: 'lab',
    name: 'National Pathology Research Lab',
    title: 'Senior Plant Pathologist',
    district: 'Peradeniya Research Center',
    id: '00000000-0000-0000-0000-000000000003',
    badge: 'LAB-SL-01',
  },
  ADMIN: {
    email: 'admin@gmail.com',
    password: 'admin123',
    role: 'admin',
    name: 'System Administrator',
    title: 'Platform Operations Lead',
    district: 'Ministry HQ Colombo',
    id: '00000000-0000-0000-0000-000000000004',
    badge: 'SYS-ADMIN',
  },
};

const getRoleRedirect = (role) => {
  const r = (role || '').toLowerCase();
  if (r === 'officer') return '/officer';
  if (r === 'lab') return '/lab';
  if (r === 'admin') return '/admin';
  return '/farmer';
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
        const targetRedirect = redirectTo || getRoleRedirect(userData.role);
        _persistUserSession(userData, token, targetRedirect);
        return { success: true, user: userData, redirectTo: targetRedirect };
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
      if (cleanEmail === DEMO_ACCOUNTS.LAB.email && cleanPass === DEMO_ACCOUNTS.LAB.password) {
        const userData = DEMO_ACCOUNTS.LAB;
        _persistUserSession(userData, 'demo-token-lab', '/lab');
        return { success: true, user: userData, redirectTo: '/lab' };
      }
      if (cleanEmail === DEMO_ACCOUNTS.ADMIN.email && cleanPass === DEMO_ACCOUNTS.ADMIN.password) {
        const userData = DEMO_ACCOUNTS.ADMIN;
        _persistUserSession(userData, 'demo-token-admin', '/admin');
        return { success: true, user: userData, redirectTo: '/admin' };
      }

      return {
        success: false,
        error: apiErr.message || 'Invalid email or password. Please verify your credentials.',
      };
    }

    // Direct match against demo accounts if API response structure was unexpected
    for (const key of Object.keys(DEMO_ACCOUNTS)) {
      const demo = DEMO_ACCOUNTS[key];
      if (cleanEmail === demo.email && cleanPass === demo.password) {
        const targetRedirect = getRoleRedirect(demo.role);
        _persistUserSession(demo, `demo-token-${demo.role}`, targetRedirect);
        return { success: true, user: demo, redirectTo: targetRedirect };
      }
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
        const targetRedirect = redirectTo || getRoleRedirect(createdUser.role);
        _persistUserSession(createdUser, token, targetRedirect);
        return {
          success: true,
          user: createdUser,
          redirectTo: targetRedirect,
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
