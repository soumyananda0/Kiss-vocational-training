import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('kiss_vtms_user');
    const token = localStorage.getItem('kiss_vtms_token');

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        // Verify with /me
        api.get('/auth/me')
          .then((res) => {
            if (res.data?.user) {
              setUser(res.data.user);
              localStorage.setItem('kiss_vtms_user', JSON.stringify(res.data.user));
            }
          })
          .catch(() => {
            // Token expired
            logout();
          })
          .finally(() => setLoading(false));
      } catch (e) {
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.data) {
      localStorage.setItem('kiss_vtms_token', res.data.token);
      localStorage.setItem('kiss_vtms_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.error || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('kiss_vtms_token');
    localStorage.removeItem('kiss_vtms_user');
    setUser(null);
    window.location.href = '/login';
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (user.roleKey === 'super_admin') return true;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(user.roleKey);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
