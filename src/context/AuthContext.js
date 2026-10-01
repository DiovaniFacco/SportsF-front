import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import secureStorage from '../services/secureStorage';
import { onUnauthorized } from '../api/client';
import {
  loginApi,
  registerApi,
  forgotPasswordApi,
  resetPasswordApi,
  changePasswordApi,
  logoutApi,
  logoutAllApi,
  getMeApi,
  updateProfileApi,
} from '../api/auth';

const AuthContext = createContext({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  changePassword: async () => {},
  logout: async () => {},
  logoutAll: async () => {},
  updateProfile: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearLocalSession = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  // Restore existing session on mount and refresh profile from backend
  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedToken = await secureStorage.getItem('@auth_token');
        const storedUser = await secureStorage.getItem('@auth_user');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Atualiza dados atualizados do perfil a partir do backend (garante role em tempo real)
          try {
            const freshUser = await getMeApi();
            if (freshUser) {
              setUser(freshUser);
            }
          } catch (e) {
            if (e?.response?.status === 401) {
              clearLocalSession();
            }
            // Demais falhas (rede): mantém sessão local
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Erro ao carregar credenciais preservadas:', error);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadStoredAuth();
  }, [clearLocalSession]);

  // Reage na hora a 401 de qualquer request: derruba o estado do React
  // junto com o storage (antes a UI continuava "logada" até um refresh).
  useEffect(() => onUnauthorized(clearLocalSession), [clearLocalSession]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await loginApi(email, password);
      setUser(res.user);
      setToken(res.token);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, email, password, phone) => {
    setIsLoading(true);
    try {
      const res = await registerApi(name, email, password, phone);
      setUser(res.user);
      setToken(res.token);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email) => forgotPasswordApi(email);

  const resetPassword = async ({ token: resetToken, email, password }) => {
    setIsLoading(true);
    try {
      const res = await resetPasswordApi({ token: resetToken, email, password });
      setUser(res.user);
      setToken(res.token);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) =>
    changePasswordApi(currentPassword, newPassword);

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutApi();
    } finally {
      clearLocalSession();
      setIsLoading(false);
    }
  };

  const logoutAll = async () => {
    setIsLoading(true);
    try {
      await logoutAllApi();
    } finally {
      clearLocalSession();
      setIsLoading(false);
    }
  };

  const updateProfile = async (data) => {
    setIsLoading(true);
    try {
      const updatedUser = await updateProfileApi(data);
      if (updatedUser) {
        setUser(updatedUser);
      }
      return updatedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const isManager = useMemo(() => {
    if (!user) return false;
    const role = user.role?.toUpperCase();
    return role === 'GESTOR_ESPACO' || role === 'ADMIN' || role === 'GESTOR';
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!user && !!token,
      isManager,
      login,
      register,
      forgotPassword,
      resetPassword,
      changePassword,
      logout,
      logoutAll,
      updateProfile,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, token, isLoading, isManager]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
