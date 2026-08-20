import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import secureStorage from '../services/secureStorage';
import { loginApi, registerApi, googleAuthApi, logoutApi } from '../api/auth';

const AuthContext = createContext({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore existing session on mount
  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedToken = await secureStorage.getItem('@auth_token');
        const storedUser = await secureStorage.getItem('@auth_user');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
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
  }, []);

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

  const loginWithGoogle = async (googleData) => {
    setIsLoading(true);
    try {
      const res = await googleAuthApi(googleData);
      setUser(res.user);
      setToken(res.token);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutApi();
    } finally {
      setUser(null);
      setToken(null);
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
      loginWithGoogle,
      logout,
    }),
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
