import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Search, X, SlidersHorizontal, Sun, Moon, LogIn, LogOut, User, Building2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';

export function Header({ searchValue, setSearchValue, onOpenFilter, onOpenAuth, onOpenManager }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  const userName = user?.name ? user.name.split(' ')[0] : 'Esportista';

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Top Bar: Brand Logo & Controls (Theme Toggle + Auth Status) */}
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <Text style={[styles.letraS, { color: colors.letraS, textShadowColor: isDark ? 'rgba(251, 113, 133, 0.4)' : 'rgba(136, 19, 55, 0.4)' }]}>S</Text>
          <Text style={[styles.brandName, { color: colors.brandName }]}>facco</Text>
        </View>

        <View style={styles.rightActions}>
          {/* Theme Toggle Button */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={toggleTheme}
            style={[styles.themeBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
            accessibilityLabel={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          >
            {isDark ? (
              <Sun size={18} color="#F59E0B" />
            ) : (
              <Moon size={18} color={colors.textPrimary} />
            )}
          </TouchableOpacity>

          {/* Botão de Painel de Gestão para Gestores */}
          {user && (user.role === 'GESTOR_ESPACO' || user.role === 'ADMIN') ? (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={onOpenManager}
              style={[styles.authBadge, { backgroundColor: colors.primary + '18', borderColor: colors.primary }]}
            >
              <Building2 size={15} color={colors.primary} style={{ marginRight: 5 }} />
              <Text style={[styles.authBadgeText, { color: colors.primary }]}>Gestão</Text>
            </TouchableOpacity>
          ) : null}

          {/* Auth State Button */}
          {isAuthenticated ? (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={logout}
              style={[styles.authBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              accessibilityLabel="Sair da conta"
            >
              <LogOut size={15} color={colors.primary} style={{ marginRight: 5 }} />
              <Text style={[styles.authBadgeText, { color: colors.primary }]}>Sair</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={onOpenAuth}
              style={[styles.authBadge, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              accessibilityLabel="Entrar ou Cadastrar"
            >
              <LogIn size={15} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={[styles.authBadgeText, { color: '#FFFFFF' }]}>Entrar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Greeting & Hero Title */}
      <View style={styles.heroTextContainer}>
        <Text style={[styles.greetingText, { color: colors.textSecondary }]}>Olá, {userName}</Text>
        <Text style={[styles.heroTitleMain, { color: colors.textPrimary }]}>Encontre e reserve</Text>
        <Text style={[styles.heroTitleHighlight, { color: colors.primary }]}>sua quadra</Text>
      </View>

      {/* Search Input Bar with Filter Button */}
      <View style={[styles.searchBarContainer, { backgroundColor: colors.searchBg, borderColor: colors.border }]}>
        <Search size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Buscar quadras, esportes ou locais"
          placeholderTextColor={colors.textMuted}
          value={searchValue}
          onChangeText={setSearchValue}
          returnKeyType="search"
        />
        {searchValue ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSearchValue('')}
            style={styles.clearBtn}
          >
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onOpenFilter}
          style={styles.filterBtn}
        >
          <SlidersHorizontal size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  letraS: {
    fontFamily:
      Platform.OS === 'web'
        ? "'Great Vibes', cursive, 'GreatVibes_400Regular'"
        : 'GreatVibes_400Regular',
    fontSize: 46,
    marginRight: -4,
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  brandName: {
    fontFamily:
      Platform.OS === 'web'
        ? "'Josefin Sans', sans-serif, 'JosefinSans_700Bold'"
        : 'JosefinSans_700Bold',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1,
  },
  themeBtn: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  authBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroTextContainer: {
    marginBottom: theme.spacing.md,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  heroTitleMain: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  heroTitleHighlight: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },
  clearBtn: {
    padding: 6,
    marginRight: 4,
  },
  filterBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
