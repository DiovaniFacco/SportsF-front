import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { theme } from '../../styles/theme';

export function SkeletonCard() {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

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
    <View style={styles.card}>
      <Animated.View style={[styles.imagePlaceholder, { opacity: pulseAnim }]} />
      <View style={styles.content}>
        <View style={styles.row}>
          <Animated.View style={[styles.titlePlaceholder, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.badgePlaceholder, { opacity: pulseAnim }]} />
        </View>
        <Animated.View style={[styles.subtitlePlaceholder, { opacity: pulseAnim }]} />
        <View style={styles.tagsRow}>
          <Animated.View style={[styles.tagPlaceholder, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.tagPlaceholder, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.tagPlaceholder, { opacity: pulseAnim }]} />
        </View>
        <View style={styles.footer}>
          <Animated.View style={[styles.pricePlaceholder, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.btnPlaceholder, { opacity: pulseAnim }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    height: 180,
    backgroundColor: theme.colors.borderSubtle,
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
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.xs,
  },
  badgePlaceholder: {
    height: 18,
    width: 50,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.full,
  },
  subtitlePlaceholder: {
    height: 14,
    width: '80%',
    backgroundColor: theme.colors.borderSubtle,
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
    backgroundColor: theme.colors.borderSubtle,
    borderRadius: theme.radius.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  pricePlaceholder: {
    height: 24,
    width: 90,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.xs,
  },
  btnPlaceholder: {
    height: 36,
    width: 100,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.md,
  },
});
