import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Activity } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';

export function SportsBadgeGroup({ sports = [], maxVisible = 2 }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { colors } = useTheme();

  if (!sports || sports.length === 0) return null;

  const visibleSports = sports.slice(0, maxVisible);
  const remainingSports = sports.slice(maxVisible);
  const remainingCount = remainingSports.length;

  return (
    <View style={styles.container}>
      {/* First N Visible Sports */}
      {visibleSports.map((sport, idx) => (
        <View key={idx} style={[styles.sportTag, { backgroundColor: colors.statusBadgeBg }]}>
          <Activity size={11} color={colors.white} />
          <Text style={[styles.sportTagText, { color: colors.white }]}>{sport}</Text>
        </View>
      ))}

      {/* +X Badge with Tooltip on Hover/Tap */}
      {remainingCount > 0 ? (
        <View style={styles.moreBadgeWrapper}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={(e) => {
              e.stopPropagation && e.stopPropagation();
              setShowTooltip((prev) => !prev);
            }}
            {...(Platform.OS === 'web'
              ? {
                  onMouseEnter: () => setShowTooltip(true),
                  onMouseLeave: () => setShowTooltip(false),
                }
              : {})}
            style={[styles.moreBadge, { backgroundColor: colors.statusBadgeBg }]}
          >
            <Text style={[styles.moreBadgeText, { color: colors.white }]}>+{remainingCount}</Text>
          </TouchableOpacity>

          {/* Floating Popover Tooltip for Remaining Sports */}
          {showTooltip ? (
            <View style={[styles.tooltipPopover, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.tooltipTitle, { color: colors.textMuted }]}>Outras modalidades:</Text>
              <View style={styles.tooltipSportsList}>
                {remainingSports.map((sport, idx) => (
                  <View key={idx} style={[styles.tooltipSportChip, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.tooltipSportText, { color: colors.textPrimary }]}>{sport}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    zIndex: 10,
  },
  sportTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  sportTagText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
  },
  moreBadgeWrapper: {
    position: 'relative',
    zIndex: 20,
  },
  moreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  moreBadgeText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
  },
  tooltipPopover: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    minWidth: 150,
    padding: 10,
    borderRadius: theme.radius.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    zIndex: theme.zIndex.modal,
  },
  tooltipTitle: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  tooltipSportsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tooltipSportChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
  },
  tooltipSportText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
});
