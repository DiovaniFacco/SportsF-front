// FACCO Design Tokens v2.3.0 — Vinho Imperial & Slate / Dark Mode

export const lightColors = {
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
  cardBg: '#FFFFFF',
  searchBg: '#FAFAFA',

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

  letraS: '#881337',
  brandName: '#881337',
  statusBadgeBg: 'rgba(15, 23, 42, 0.75)',
};

export const darkColors = {
  primary: '#881337',        // Mesmo vermelho/vinho (#881337) do modo claro
  primaryHover: '#701A28',
  primaryActive: '#4C0519',
  primaryLight: 'rgba(136, 19, 55, 0.25)',

  secondary: '#F8FAFC',
  secondaryHover: '#E2E8F0',
  secondaryLight: '#1E293B',

  gold: '#F59E0B',
  goldSurface: 'rgba(245, 158, 11, 0.18)',

  background: '#030712',            // Fundo ultra escuro (Obsidian / Pitch Dark)
  backgroundSecondary: '#0B0F17',   // Fundo secundário bem escuro

  surface: '#0F172A',               // Superfície/Cards (Slate 900 escuro)
  surfaceElevated: '#1E293B',
  cardBg: '#0F172A',
  searchBg: '#0B0F17',

  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDisabled: '#475569',

  success: '#34D399',
  successSurface: 'rgba(52, 211, 153, 0.18)',

  warning: '#FBBF24',
  warningSurface: 'rgba(251, 191, 36, 0.18)',

  error: '#F87171',
  errorSurface: 'rgba(248, 113, 113, 0.18)',

  info: '#60A5FA',
  infoSurface: 'rgba(96, 165, 250, 0.18)',

  holding: '#A78BFA',
  holdingSurface: 'rgba(167, 139, 250, 0.18)',

  border: '#1E293B',
  borderStrong: '#334155',
  borderSubtle: '#0B0F17',
  white: '#FFFFFF',

  letraS: '#881337',                // Mesmo vermelho da letra S do modo claro
  brandName: '#881337',             // Mesmo vermelho do facco do modo claro
  statusBadgeBg: 'rgba(3, 7, 18, 0.85)',
};

const baseTokens = {

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

export function getTheme(isDark = false) {
  return {
    ...baseTokens,
    colors: isDark ? darkColors : lightColors,
    isDark,
  };
}

export const theme = getTheme(false);

