import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';

export function RatingBadge({ rating, reviewCount }) {
  const { colors } = useTheme();
  const score = rating ? rating.toFixed(1) : '4.9';

  return (
    <View style={styles.badge}>
      <Star size={12} color={colors.gold} fill={colors.gold} />
      <Text style={[styles.score, { color: colors.textPrimary }]}>{score}</Text>
      <Text style={[styles.count, { color: colors.textMuted }]}>({reviewCount || 50})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  score: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '800',
  },
  count: {
    fontSize: theme.typography.sizes.caption,
  },
});