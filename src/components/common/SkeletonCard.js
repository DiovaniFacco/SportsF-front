import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';

export function SkeletonCard() {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const { colors } = useTheme();

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Animated.View style={[styles.imagePlaceholder, { opacity: pulseAnim, backgroundColor: colors.borderSubtle }]} />
      <View style={styles.content}>
        <View style={styles.row}>
          <Animated.View style={[styles.titlePlaceholder, { opacity: pulseAnim, backgroundColor: colors.border }]} />
          <Animated.View style={[styles.badgePlaceholder, { opacity: pulseAnim, backgroundColor: colors.border }]} />
        </View>
        <Animated.View style={[styles.subtitlePlaceholder, { opacity: pulseAnim, backgroundColor: colors.borderSubtle }]} />
        <View style={styles.tagsRow}>
          <Animated.View style={[styles.tagPlaceholder, { opacity: pulseAnim, backgroundColor: colors.borderSubtle }]} />
          <Animated.View style={[styles.tagPlaceholder, { opacity: pulseAnim, backgroundColor: colors.borderSubtle }]} />
          <Animated.View style={[styles.tagPlaceholder, { opacity: pulseAnim, backgroundColor: colors.borderSubtle }]} />
        </View>
        <View style={[styles.footer, { borderTopColor: colors.borderSubtle }]}>
          <Animated.View style={[styles.pricePlaceholder, { opacity: pulseAnim, backgroundColor: colors.border }]} />
          <Animated.View style={[styles.btnPlaceholder, { opacity: pulseAnim, backgroundColor: colors.border }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    height: 180,
    width: '100%',
  },
  content: {
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  titlePlaceholder: {
    height: 20,
    width: '60%',
    borderRadius: theme.radius.xs,
  },
  badgePlaceholder: {
    height: 18,
    width: 50,
    borderRadius: theme.radius.full,
  },
  subtitlePlaceholder: {
    height: 14,
    width: '80%',
    borderRadius: theme.radius.xs,
    marginBottom: theme.spacing.md,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  tagPlaceholder: {
    height: 22,
    width: 70,
    borderRadius: theme.radius.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
  },
  pricePlaceholder: {
    height: 24,
    width: 90,
    borderRadius: theme.radius.xs,
  },
  btnPlaceholder: {
    height: 36,
    width: 100,
    borderRadius: theme.radius.md,
  },
});
