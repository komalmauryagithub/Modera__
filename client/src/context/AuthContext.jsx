import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('memora_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('memora_token'));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Restore session on mount
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const storedToken = localStorage.getItem('memora_token');
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (isMounted && response?.success && response.user) {
          setUser(response.user);
          localStorage.setItem('memora_user', JSON.stringify(response.user));
        }
      } catch (err) {
        // If token expired or invalid, purge local storage
        if (isMounted) {
          localStorage.removeItem('memora_token');
          localStorage.removeItem('memora_user');
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    restoreSession();

    // Listener for token expiration events fired from axiosClient
    const handleAuthExpired = () => {
      setToken(null);
      setUser(null);
      setAuthError('Your session has expired. Please log in again.');
    };

    window.addEventListener('memora_auth_expired', handleAuthExpired);
    return () => {
      isMounted = false;
      window.removeEventListener('memora_auth_expired', handleAuthExpired);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await authApi.login({ email, password });
      if (data.success && data.token) {
        localStorage.setItem('memora_token', data.token);
        localStorage.setItem('memora_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      throw new Error(data.message || 'Login failed.');
    } catch (err) {
      const msg = err.message || 'Failed to login. Please check your credentials.';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await authApi.register({ name, email, password });
      if (data.success && data.token) {
        localStorage.setItem('memora_token', data.token);
        localStorage.setItem('memora_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      throw new Error(data.message || 'Registration failed.');
    } catch (err) {
      const msg = err.message || 'Failed to register account.';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('memora_token');
    localStorage.removeItem('memora_user');
    setToken(null);
    setUser(null);
    setAuthError(null);
  }, []);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    authError,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
