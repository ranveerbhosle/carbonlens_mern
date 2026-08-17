import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken } from '../lib/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'carbonlens_auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.token) {
          setToken(saved.token);
          setAuthToken(saved.token);
        }
        if (saved?.user) setUser(saved.user);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /** Keep navbar / stored profile in sync with MongoDB (fixes stale coins vs leaderboard). */
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser((prev) => ({
        ...(prev || {}),
        _id: data._id,
        name: data.name,
        email: data.email,
        greenCoins: data.greenCoins,
        badge: data.badge,
        totalBillsUploaded: data.totalBillsUploaded,
        consecutiveLowEmissions: data.consecutiveLowEmissions,
      }));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    refreshUser();
  }, [token, refreshUser]);

  useEffect(() => {
    if (!token && !user) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
  }, [token, user]);

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 3500);
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    setToken(data.token);
    setAuthToken(data.token);
    setUser({
      _id: data._id,
      name: data.name,
      email: data.email,
      greenCoins: data.greenCoins,
      badge: data.badge,
    });
    return data;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setAuthToken(data.token);
    setUser({
      _id: data._id,
      name: data.name,
      email: data.email,
      greenCoins: data.greenCoins,
      badge: data.badge,
      totalBillsUploaded: data.totalBillsUploaded,
      consecutiveLowEmissions: data.consecutiveLowEmissions,
    });
    return data;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
  }, []);

  const updateCoins = useCallback(({ greenCoins, badge }) => {
    setUser((u) => (u ? { ...u, greenCoins, badge } : u));
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      toast,
      showToast,
      register,
      login,
      logout,
      updateCoins,
      refreshUser,
    }),
    [user, token, loading, toast, showToast, register, login, logout, updateCoins, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

