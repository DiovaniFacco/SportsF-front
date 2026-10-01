import apiClient from './client';
import secureStorage from '../services/secureStorage';
import { mapAuthError } from '../utils/authErrors';

async function saveSession(user, access_token) {
  if (access_token) {
    await secureStorage.setItem('@auth_token', access_token);
    await secureStorage.setItem('@auth_user', JSON.stringify(user));
  }
  return { success: true, user, token: access_token };
}

export async function loginApi(email, password) {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    const { user, access_token } = response.data;
    return saveSession(user, access_token);
  } catch (error) {
    if (__DEV__) {
      console.warn('Erro na API de login:', error?.message);
    }
    throw new Error(mapAuthError(error, 'Não foi possível realizar o login. Verifique suas credenciais ou conexão com o servidor.'));
  }
}

export async function registerApi(name, email, password, phone = null) {
  try {
    const response = await apiClient.post('/auth/register', {
      name,
      email,
      password,
      password_confirmation: password,
      phone,
    });
    const { user, access_token } = response.data;
    return saveSession(user, access_token);
  } catch (error) {
    if (__DEV__) {
      console.warn('Erro na API de registro:', error?.message);
    }
    throw new Error(mapAuthError(error, 'Não foi possível criar a conta. Verifique os dados inseridos.'));
  }
}

export async function forgotPasswordApi(email) {
  try {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data?.message || 'Se o e-mail estiver cadastrado, você receberá o link em instantes.';
  } catch (error) {
    if (__DEV__) {
      console.warn('Erro na API forgot-password:', error?.message);
    }
    throw new Error(mapAuthError(error, 'Não foi possível enviar o link. Tente novamente.'));
  }
}

export async function resetPasswordApi({ token, email, password }) {
  try {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      email,
      password,
      password_confirmation: password,
    });
    const { user, access_token } = response.data;
    return saveSession(user, access_token);
  } catch (error) {
    if (__DEV__) {
      console.warn('Erro na API reset-password:', error?.message);
    }
    throw new Error(mapAuthError(error, 'Não foi possível redefinir a senha. Verifique o link e tente novamente.'));
  }
}

export async function changePasswordApi(currentPassword, newPassword) {
  try {
    const response = await apiClient.put('/auth/password', {
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: newPassword,
    });
    return response.data?.message || 'Senha alterada com sucesso.';
  } catch (error) {
    if (__DEV__) {
      console.warn('Erro na API change-password:', error?.message);
    }
    throw new Error(mapAuthError(error, 'Não foi possível alterar a senha.'));
  }
}

export async function updateProfileApi(data) {
  try {
    const response = await apiClient.put('/auth/me', data);
    const updatedUser = response.data?.user;
    if (updatedUser) {
      await secureStorage.setItem('@auth_user', JSON.stringify(updatedUser));
    }
    return updatedUser;
  } catch (error) {
    if (__DEV__) {
      console.warn('Erro ao atualizar perfil:', error?.message);
    }
    throw new Error(mapAuthError(error, 'Não foi possível atualizar seus dados.'));
  }
}

export async function getMeApi() {
  try {
    const response = await apiClient.get('/auth/me');
    if (response.data?.user) {
      await secureStorage.setItem('@auth_user', JSON.stringify(response.data.user));
    }
    return response.data.user;
  } catch (error) {
    // 401 = token inválido/expirado: o interceptor já limpou o storage —
    // nunca devolver dado obsoleto como se fosse sessão válida.
    if (error?.response?.status === 401) {
      throw error;
    }
    // Falha de rede: mantém sessão local (offline razoável).
    const storedUser = await secureStorage.getItem('@auth_user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    throw error;
  }
}

export async function logoutApi() {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    if (__DEV__) {
      console.warn('Logout no backend:', error.message);
    }
  } finally {
    await secureStorage.removeItem('@auth_token');
    await secureStorage.removeItem('@auth_user');
  }
}

export async function logoutAllApi() {
  try {
    await apiClient.post('/auth/logout-all');
  } catch (error) {
    if (__DEV__) {
      console.warn('Logout-all no backend:', error.message);
    }
  } finally {
    await secureStorage.removeItem('@auth_token');
    await secureStorage.removeItem('@auth_user');
  }
}

export async function getUsersApi() {
  try {
    const response = await apiClient.get('/users');
    return response.data?.users || [];
  } catch (error) {
    if (__DEV__) {
      console.warn('Erro ao buscar lista de usuários:', error.message);
    }
    return [];
  }
}
