import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Search, X, SlidersHorizontal, Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';

export function Header({ searchValue, setSearchValue, onOpenFilter }) {
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Top Bar: Brand Logo & Theme Toggle Action */}
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <Text style={[styles.letraS, { color: colors.letraS, textShadowColor: colors.isDark ? 'rgba(251, 113, 133, 0.4)' : 'rgba(136, 19, 55, 0.4)' }]}>S</Text>
          <Text style={[styles.brandName, { color: colors.brandName }]}>facco</Text>
        </View>

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
      </View>

      {/* Greeting & Hero Title */}
      <View style={styles.heroTextContainer}>
        <Text style={[styles.greetingText, { color: colors.textSecondary }]}>Olá, Diovani 👋</Text>
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
