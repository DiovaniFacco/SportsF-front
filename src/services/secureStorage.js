import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Secure Storage wrapper that uses Expo SecureStore on native devices (iOS/Android)
 * and falls back to AsyncStorage on Web.
 */
export const secureStorage = {
  async setItem(key, value) {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.warn(`[secureStorage] Erro ao salvar chave ${key}:`, error?.message || error);
    }
  },

  async getItem(key) {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.warn(`[secureStorage] Erro ao obter chave ${key}:`, error?.message || error);
      return null;
    }
  },

  async removeItem(key) {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.warn(`[secureStorage] Erro ao remover chave ${key}:`, error?.message || error);
    }
  },
};

export default secureStorage;
