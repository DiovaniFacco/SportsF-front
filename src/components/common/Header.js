import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Search, X, SlidersHorizontal } from 'lucide-react-native';
import { theme } from '../../styles/theme';

export function Header({ searchValue, setSearchValue, onOpenFilter }) {
  return (
    <View style={styles.container}>
      {/* Top Bar: Brand Logo with Great Vibes 'S' and Josefin Sans Bold 'facco' */}
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <Text style={styles.letraS}>S</Text>
          <Text style={styles.brandName}>facco</Text>
        </View>
      </View>

      {/* Greeting & Hero Title */}
      <View style={styles.heroTextContainer}>
        <Text style={styles.greetingText}>Olá, Diovani 👋</Text>
        <Text style={styles.heroTitleMain}>Encontre e reserve</Text>
        <Text style={styles.heroTitleHighlight}>sua quadra</Text>
      </View>

      {/* Search Input Bar with Filter Button */}
      <View style={styles.searchBarContainer}>
        <Search size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar quadras, esportes ou locais"
          placeholderTextColor={theme.colors.textMuted}
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
            <X size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onOpenFilter}
          style={styles.filterBtn}
        >
          <SlidersHorizontal size={18} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
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
    color: 'rgb(136, 19, 55)',
    marginRight: -4,
    textShadowColor: 'rgba(136, 19, 55, 0.4)',
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
    color: 'rgb(136, 19, 55)',
    letterSpacing: -1,
  },
  heroTextContainer: {
    marginBottom: theme.spacing.md,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  heroTitleMain: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  heroTitleHighlight: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 52,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
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
