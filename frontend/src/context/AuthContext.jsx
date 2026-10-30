import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client.js';
import { notifyInfo } from '../utils/alerts.js';

const AuthContext = createContext(null);

const emptyPermissions = {
  manageUsers: false,
  createAdmins: false,
  addProducts: false,
  editProducts: false,
  deleteProducts: false,
  moveStock: false
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/me');
      setUser(data.user || null);
      return data.user || null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/login', { email, password });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/logout');
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser((current) => {
        if (current) notifyInfo('Session expired', 'Please sign in again to continue.');
        return null;
      });
    };

    window.addEventListener('inventory:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('inventory:unauthorized', handleUnauthorized);
  }, []);

  const permissions = useMemo(() => {
    if (!user) return emptyPermissions;
    return {
      manageUsers: ['super_admin', 'admin'].includes(user.role),
      createAdmins: user.role === 'super_admin',
      addProducts: true,
      editProducts: ['super_admin', 'admin', 'manager'].includes(user.role),
      deleteProducts: ['super_admin', 'admin'].includes(user.role),
      moveStock: true
    };
  }, [user]);

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh, permissions }),
    [user, loading, login, logout, refresh, permissions]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
