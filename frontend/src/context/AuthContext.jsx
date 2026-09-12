import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
    officer_id: 'officer-wp-04',
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

  const login = (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (cleanEmail === DEMO_ACCOUNTS.FARMER.email && cleanPass === DEMO_ACCOUNTS.FARMER.password) {
      const userData = DEMO_ACCOUNTS.FARMER;
      setUser(userData);
      localStorage.setItem('agrinova_user', JSON.stringify(userData));
      localStorage.setItem('agrishield_farmer_id', userData.farmer_id);
      localStorage.setItem('user_id', userData.farmer_id);
      localStorage.setItem('agrishield_farm_id', userData.farm_id);
      return { success: true, user: userData, redirectTo: '/farmer' };
    }

    if (cleanEmail === DEMO_ACCOUNTS.OFFICER.email && cleanPass === DEMO_ACCOUNTS.OFFICER.password) {
      const userData = DEMO_ACCOUNTS.OFFICER;
      setUser(userData);
      localStorage.setItem('agrinova_user', JSON.stringify(userData));
      localStorage.setItem('officer_id', userData.officer_id);
      return { success: true, user: userData, redirectTo: '/officer' };
    }

    return {
      success: false,
      error: 'Invalid credentials. Please use the demo credentials provided below.',
    };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('agrinova_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, demoAccounts: DEMO_ACCOUNTS }}>
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
