import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';

export function SlotLegend() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
      <View style={styles.legendItem}>
        <View style={[styles.indicator, styles.availableIndicator, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]} />
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>Disponível</Text>
      </View>

      <View style={styles.legendItem}>
        <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>Selecionado</Text>
      </View>

      <View style={styles.legendItem}>
        <View style={[styles.indicator, styles.unavailableIndicator, { backgroundColor: colors.border }]} />
        <Text style={[styles.legendText, { color: colors.textMuted }]}>Indisponível</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  availableIndicator: {
    borderWidth: 1.5,
  },
  unavailableIndicator: {
    opacity: 0.8,
  },
  legendText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
});
