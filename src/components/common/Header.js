import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Platform, Alert } from 'react-native';
import { Search, X, LogIn, LogOut, Building2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';

export function Header({
  searchValue,
  setSearchValue,
  onOpenAuth,
  onOpenManager,
}) {
  const { colors } = useTheme();
  const { user, isAuthenticated, isManager, logout } = useAuth();

  const userName = user?.name ? user.name.split(' ')[0] : 'Esportista';

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await logout();
      } catch (e) {
        console.warn('Erro ao efetuar logout:', e);
      } finally {
        if (onOpenAuth) {
          onOpenAuth();
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Tem certeza de que deseja sair da conta?')) {
        doLogout();
      }
    } else {
      Alert.alert('Sair da Conta', 'Tem certeza de que deseja sair?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: doLogout,
        },
      ]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Top Bar: Brand Logo & Right Action Buttons */}
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <Text style={[styles.letraS, { color: colors.letraS }]}>S</Text>
          <Text style={[styles.brandName, { color: colors.brandName }]}>facco</Text>
        </View>

        <View style={styles.rightActions}>
          {/* Botão de Painel de Gestão para Gestores / Admins */}
          {isAuthenticated && (isManager || user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'GESTOR_ESPACO') ? (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={onOpenManager}
              style={[styles.authBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
            >
              <Building2 size={14} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.authBadgeText, { color: colors.primary }]}>Gestão</Text>
            </TouchableOpacity>
          ) : null}

          {/* Auth State Button */}
          {isAuthenticated ? (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleLogout}
              style={[styles.authBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              accessibilityLabel="Sair da conta"
            >
              <LogOut size={14} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.authBadgeText, { color: colors.primary }]}>Sair</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={onOpenAuth}
              style={[styles.authBadge, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              accessibilityLabel="Entrar ou Cadastrar"
            >
              <LogIn size={14} color={colors.white} style={{ marginRight: 4 }} />
              <Text style={[styles.authBadgeText, { color: colors.white }]}>Entrar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Greeting & Hero Title */}
      <View style={styles.heroTextContainer}>
        <Text style={[styles.greetingText, { color: colors.textSecondary }]}>Olá, {userName}</Text>
        <View style={styles.heroTitleRow}>
          <Text style={[styles.heroTitleMain, { color: colors.textPrimary }]}>Encontre e reserve </Text>
          <Text style={[styles.heroTitleHighlight, { color: colors.primary }]}>sua quadra</Text>
        </View>
      </View>

      {/* Search Input Bar (Busca Geral) */}
      <View style={[styles.searchBarContainer, { backgroundColor: colors.searchBg, borderColor: colors.border }]}>
        <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 10 : 12,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
    flexWrap: 'nowrap',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexShrink: 1,
  },
  letraS: {
    fontFamily:
      Platform.OS === 'web'
        ? "'Great Vibes', cursive, 'GreatVibes_400Regular'"
        : 'GreatVibes_400Regular',
    fontSize: 38,
    marginRight: -4,
  },
  brandName: {
    fontFamily:
      Platform.OS === 'web'
        ? "'Josefin Sans', sans-serif, 'JosefinSans_700Bold'"
        : 'JosefinSans_700Bold',
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  authBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 32,
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  authBadgeText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '700',
  },
  heroTextContainer: {
    marginBottom: theme.spacing.sm,
  },
  greetingText: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '500',
    marginBottom: 2,
  },
  heroTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
  },
  heroTitleMain: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 27,
    letterSpacing: -0.5,
  },
  heroTitleHighlight: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 27,
    letterSpacing: -0.5,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
  },
  clearBtn: {
    padding: 6,
  },
});

