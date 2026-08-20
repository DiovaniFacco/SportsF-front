import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loginApi(email, password) {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    const { user, access_token } = response.data;
    if (access_token) {
      await AsyncStorage.setItem('@auth_token', access_token);
      await AsyncStorage.setItem('@auth_user', JSON.stringify(user));
    }
    return { success: true, user, token: access_token };
  } catch (error) {
    console.error('Erro na API de login:', error?.response?.data || error.message);
    const msg = error?.response?.data?.message || (error?.response?.data?.errors ? Object.values(error.response.data.errors)[0]?.[0] : null) || 'Não foi possível realizar o login. Verifique suas credenciais ou conexão com o servidor.';
    throw new Error(msg);
  }
}

export async function registerApi(name, email, password, phone = null) {
  try {
    const response = await apiClient.post('/auth/register', {
      name,
      email,
      password,
      phone,
    });
    const { user, access_token } = response.data;
    if (access_token) {
      await AsyncStorage.setItem('@auth_token', access_token);
      await AsyncStorage.setItem('@auth_user', JSON.stringify(user));
    }
    return { success: true, user, token: access_token };
  } catch (error) {
    console.error('Erro na API de registro:', error?.response?.data || error.message);
    const msg = error?.response?.data?.message || (error?.response?.data?.errors ? Object.values(error.response.data.errors)[0]?.[0] : null) || 'Não foi possível criar a conta. Verifique os dados inseridos.';
    throw new Error(msg);
  }
}

export async function googleAuthApi(googleUserData) {
  try {
    const response = await apiClient.post('/auth/google', {
      email: googleUserData.email,
      name: googleUserData.name,
      google_id: googleUserData.id || googleUserData.google_id || null,
      avatar: googleUserData.photo || googleUserData.avatar || null,
    });
    const { user, access_token } = response.data;
    if (access_token) {
      await AsyncStorage.setItem('@auth_token', access_token);
      await AsyncStorage.setItem('@auth_user', JSON.stringify(user));
    }
    return { success: true, user, token: access_token };
  } catch (error) {
    console.error('Erro na API Google Auth:', error?.response?.data || error.message);
    const msg = error?.response?.data?.message || 'Falha ao autenticar com o Google.';
    throw new Error(msg);
  }
}

export async function getMeApi() {
  try {
    const response = await apiClient.get('/auth/me');
    if (response.data?.user) {
      await AsyncStorage.setItem('@auth_user', JSON.stringify(response.data.user));
    }
    return response.data.user;
  } catch (error) {
    const storedUser = await AsyncStorage.getItem('@auth_user');
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
    console.warn('Logout no backend:', error.message);
  } finally {
    await AsyncStorage.removeItem('@auth_token');
    await AsyncStorage.removeItem('@auth_user');
  }
}
