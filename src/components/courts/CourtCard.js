import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { ShieldCheck, Users, ChevronRight, SunMedium, Layers } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { SportsBadgeGroup } from '../common/SportsBadgeGroup';
import { optimizeImageUrl } from '../../utils/imageUtils';

export function CourtCard({ court, onSelectCourt }) {
  const { colors } = useTheme();

  if (!court) return null;

  const sportsList = court.sports && court.sports.length > 0
    ? court.sports
    : (court.type ? court.type.split('•').map(s => s.trim()) : []);

  return (
    <TouchableOpacity
      activeOpacity={0.94}
      onPress={() => onSelectCourt && onSelectCourt(court)}
      style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
    >
      {/* Court Cover Image Header */}
      <View style={[styles.imageWrapper, { backgroundColor: colors.backgroundSecondary }]}>
        <Image
          source={{
            uri: optimizeImageUrl(court.image_url, { width: 1400, quality: 90 }),
          }}
          style={styles.coverImage}
          resizeMode="cover"
        />

        {/* Structure Status Badge (Covered vs Outdoor) */}
        <View style={[styles.statusBadge, { backgroundColor: colors.statusBadgeBg }]}>
          {court.is_covered ? (
            <ShieldCheck size={12} color={colors.primaryLight || '#FFF1F2'} />
          ) : (
            <SunMedium size={12} color={colors.warning} />
          )}
          <Text style={styles.statusText}>
            {court.is_covered ? 'Coberta' : 'Ao Ar Livre'}
          </Text>
        </View>

        {/* Multi-sport tags wrapper for court */}
        {sportsList.length > 0 ? (
          <View style={styles.sportsContainer}>
            <SportsBadgeGroup sports={sportsList} maxVisible={2} />
          </View>
        ) : null}
      </View>

      {/* Card Content Body */}
      <View style={styles.contentBody}>
        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={[styles.courtName, { color: colors.textPrimary }]} numberOfLines={1}>
            {court.name}
          </Text>
          <ChevronRight size={18} color={colors.textMuted} />
        </View>

        {/* Spec Pills & Details */}
        <View style={styles.specsContainer}>
          {/* Capacity Pill */}
          {court.capacity ? (
            <View style={[styles.specChip, { backgroundColor: colors.backgroundSecondary }]}>
              <Users size={13} color={colors.primary} />
              <Text style={[styles.specChipText, { color: colors.textSecondary }]}>{court.capacity}</Text>
            </View>
          ) : null}

          {/* Surface Pill */}
          {court.surface ? (
            <View style={[styles.specChip, { backgroundColor: colors.backgroundSecondary }]}>
              <Layers size={13} color={colors.textMuted} />
              <Text style={[styles.specChipText, { color: colors.textSecondary }]}>{court.surface}</Text>
            </View>
          ) : null}
        </View>

        {/* Footer Info (CTA) - full width para equilibrar o card */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onSelectCourt && onSelectCourt(court)}
            style={[styles.ctaButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
          >
            <Text style={styles.ctaText}>Ver horários</Text>
            <ChevronRight size={16} color={colors.white} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.lg,
    overflow: 'visible',
    ...theme.shadows.sm,
  },
  imageWrapper: {
    position: 'relative',
    height: 200,
    width: '100%',
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    gap: 6,
    zIndex: 1,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
  sportsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    zIndex: 10,
  },
  contentBody: {
    padding: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  courtName: {
    flex: 1,
    fontSize: theme.typography.sizes.h3,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginRight: 8,
  },
  specsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.sm,
    gap: 6,
  },
  specChipText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
  },
  ctaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: theme.radius.md,
    ...theme.shadows.sm,
    elevation: 3,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.button,
    fontWeight: '700',
  },
});
