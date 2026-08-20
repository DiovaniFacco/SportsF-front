import React, { createContext, useContext, useMemo } from 'react';
import { getTheme, lightColors } from '../styles/theme';

const ThemeContext = createContext({
  themeMode: 'light',
  isDark: false,
  theme: getTheme(),
  colors: lightColors,
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const activeTheme = useMemo(() => getTheme(), []);

  const value = useMemo(
    () => ({
      themeMode: 'light',
      isDark: false,
      theme: activeTheme,
      colors: activeTheme.colors,
      setThemeMode: () => {},
      toggleTheme: () => {},
      isLoaded: true,
    }),
    [activeTheme]
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
