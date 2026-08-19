import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme, lightColors, darkColors } from '../styles/theme';

const STORAGE_KEY = '@sfacco_theme_mode';

const ThemeContext = createContext({
  themeMode: 'system',
  isDark: false,
  theme: getTheme(false),
  colors: lightColors,
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme setting from AsyncStorage on boot
  useEffect(() => {
    async function loadThemePreference() {
      try {
        const savedMode = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
          setThemeModeState(savedMode);
        }
      } catch (error) {
        console.warn('Erro ao carregar preferência de tema:', error);
      } finally {
        setIsLoaded(true);
      }
    }
    loadThemePreference();
  }, []);

  const setThemeMode = async (mode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Erro ao salvar preferência de tema:', error);
    }
  };

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const toggleTheme = async () => {
    const nextMode = isDark ? 'light' : 'dark';
    await setThemeMode(nextMode);
  };

  const activeTheme = useMemo(() => getTheme(isDark), [isDark]);

  const value = useMemo(
    () => ({
      themeMode,
      isDark,
      theme: activeTheme,
      colors: activeTheme.colors,
      setThemeMode,
      toggleTheme,
      isLoaded,
    }),
    [themeMode, isDark, activeTheme, isLoaded]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser utilizado dentro de um ThemeProvider');
  }
  return context;
}
