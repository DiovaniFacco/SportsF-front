import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Star } from 'lucide-react';
import { theme } from '../../styles/theme';

export function RatingBadge({ rating, reviewCount }) {
  const score = rating ? rating.toFixed(1) : '4.9';

  return (
    <View style={styles.badge}>
      <Star size={12} color={theme.colors.gold} fill={theme.colors.gold} />
      <Text style={styles.score}>{score}</Text>
      <Text style={styles.count}>({reviewCount || 50})</Text>
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
    color: theme.colors.textPrimary,
  },
  count: {
    fontSize: theme.typography.sizes.caption,
    color: theme.colors.textMuted,
  },
});