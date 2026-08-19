import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { ShieldCheck, Users, ChevronRight, SunMedium, Layers } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { SportsBadgeGroup } from '../common/SportsBadgeGroup';

export function CourtCard({ court, onSelectCourt }) {
  if (!court) return null;

  const sportsList = court.sports && court.sports.length > 0
    ? court.sports
    : (court.type ? court.type.split('•').map(s => s.trim()) : []);

  return (
    <TouchableOpacity
      activeOpacity={0.94}
      onPress={() => onSelectCourt && onSelectCourt(court)}
      style={styles.cardContainer}
    >
      {/* Court Cover Image Header */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: court.image_url }}
          style={styles.coverImage}
          resizeMode="cover"
        />

        {/* Structure Status Badge (Covered vs Outdoor) */}
        <View style={styles.statusBadge}>
          {court.is_covered ? (
            <ShieldCheck size={12} color={theme.colors.success} />
          ) : (
            <SunMedium size={12} color={theme.colors.warning} />
          )}
          <Text style={styles.statusText}>
            {court.is_covered ? 'Coberta Climatizada' : 'Ao Ar Livre'}
          </Text>
        </View>

        {/* Multi-sport tags wrapper for court (max 2 visible + tooltip) */}
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
          <Text style={styles.courtName} numberOfLines={1}>
            {court.name}
          </Text>
        </View>

        {/* Spec Pills & Details */}
        <View style={styles.specsContainer}>
          {/* Capacity Pill */}
          {court.capacity ? (
            <View style={styles.specChip}>
              <Users size={13} color={theme.colors.primary} />
              <Text style={styles.specChipText}>{court.capacity}</Text>
            </View>
          ) : null}

          {/* Surface Pill */}
          {court.surface ? (
            <View style={styles.specChip}>
              <Layers size={13} color={theme.colors.textMuted} />
              <Text style={styles.specChipText}>{court.surface}</Text>
            </View>
          ) : null}
        </View>

        {/* Footer Info (Price + CTA) */}
        <View style={styles.cardFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>valor por hora</Text>
            <View style={styles.priceRow}>
              <Text style={styles.currency}>R$</Text>
              <Text style={styles.priceValue}>{Math.round(court.hourly_rate)}</Text>
              <Text style={styles.perHour}>/hora</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onSelectCourt && onSelectCourt(court)}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>Ver horários</Text>
            <ChevronRight size={14} color={theme.colors.white} style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.lg,
    overflow: 'visible',
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  imageWrapper: {
    position: 'relative',
    height: 175,
    width: '100%',
    backgroundColor: theme.colors.backgroundSecondary,
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    gap: 6,
    zIndex: 1,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: 11,
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
    marginBottom: theme.spacing.xs,
  },
  courtName: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  specsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.sm,
    gap: 6,
  },
  specChipText: {
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  priceContainer: {
    justifyContent: 'center',
  },
  priceLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    marginRight: 2,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  perHour: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 2,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.button,
    fontWeight: '700',
  },
});
