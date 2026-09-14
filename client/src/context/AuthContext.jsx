import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePortal, setActivePortal] = useState('website'); // 'website' | 'saas'

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('restoza_token');
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data.user);
          setActivePortal('saas'); // If logged in staff, open SaaS workspace by default
        } catch (err) {
          console.warn('Session expired or invalid:', err);
          localStorage.removeItem('restoza_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('restoza_token', res.data.token);
    setUser(res.data.user);
    setActivePortal('saas');
    return res.data;
  };

  const demoLogin = async (role) => {
    const res = await authAPI.demoLogin(role);
    localStorage.setItem('restoza_token', res.data.token);
    setUser(res.data.user);
    setActivePortal('saas');
    return res.data;
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    localStorage.setItem('restoza_token', res.data.token);
    setUser(res.data.user);
    setActivePortal('saas');
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('restoza_token');
    setUser(null);
    setActivePortal('website');
  };

  const value = {
    user,
    loading,
    activePortal,
    setActivePortal,
    login,
    demoLogin,
    register,
    logout,
    isStaff: !!user,
    isManager: user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN',
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isWaiter: user?.role === 'WAITER',
    isKitchen: user?.role === 'KITCHEN',
    isCashier: user?.role === 'CASHIER',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
