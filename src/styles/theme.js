// FACCO Design Tokens v2.2.0 — Vinho Imperial Escuro & Slate
export const theme = {
  colors: {
    primary: '#881337',        // Vinho Imperial Escuro (Deep Wine Crimson)
    primaryHover: '#701A28',   // Vinho Ultra Escuro
    primaryActive: '#4C0519',  // Vinho Profundo
    primaryLight: '#FFF1F2',   // Fundo Suave Vinho

    secondary: '#0F172A',      // Slate Charcoal
    secondaryHover: '#1E293B',
    secondaryLight: '#F1F5F9',

    gold: '#D97706',           // Dourado para badges e estrelas
    goldSurface: '#FEF3C7',

    background: '#F8FAFC',
    backgroundSecondary: '#F1F5F9',

    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',

    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    textDisabled: '#94A3B8',

    success: '#10B981',
    successSurface: '#ECFDF5',

    warning: '#F59E0B',
    warningSurface: '#FEF3C7',

    error: '#BE123C',
    errorSurface: '#FFF1F2',

    info: '#2563EB',
    infoSurface: '#EFF6FF',

    holding: '#7C3AED',
    holdingSurface: '#F5F3FF',

    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    borderSubtle: '#F1F5F9',
    white: '#FFFFFF',
  },

  dark: {
    background: '#0F0910',
    surface: '#1A0F1A',
    surfaceElevated: '#2D192D',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#3D223D',
    primary: '#FB7185',
  },

  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  radius: {
    xs: 4,
    sm: 6,
    md: 10,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  typography: {
    fontFamily: {
      heading: 'System',
      body: 'System',
    },
    sizes: {
      display: 44,
      h1: 32,
      h2: 24,
      h3: 20,
      h4: 16,
      bodyLarge: 18,
      body: 14,
      bodySmall: 12,
      caption: 11,
      label: 13,
      button: 14,
    },
    lineHeight: {
      display: 52,
      h1: 40,
      h2: 32,
      h3: 28,
      h4: 24,
      bodyLarge: 28,
      body: 20,
      bodySmall: 16,
      caption: 14,
      label: 18,
      button: 20,
    },
  },

  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    subtle: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    sm: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 3,
    },
    md: {
      shadowColor: '#881337',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 5,
    },
    lg: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
    },
  },

  zIndex: {
    base: 0,
    sticky: 10,
    header: 20,
    bottomNav: 30,
    dropdown: 40,
    overlay: 50,
    modal: 60,
    toast: 70,
  },
};
