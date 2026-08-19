import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { MapPin, ChevronRight } from 'lucide-react';
import { theme } from '../../styles/theme';
import { RatingBadge } from '../common/RatingBadge';
import { AmenityChip } from '../common/AmenityChip';
import { SportsBadgeGroup } from '../common/SportsBadgeGroup';

export function ComplexCard({ venue, onPress }) {
  if (!venue) return null;

  const courtsCount = venue.courts_count || (venue.courts ? venue.courts.length : 0);
  const sportsList = venue.sports && venue.sports.length > 0 ? venue.sports : [];

  return (
    <TouchableOpacity
      activeOpacity={0.94}
      onPress={() => onPress && onPress(venue)}
      style={styles.cardContainer}
    >
      {/* Cover Image — the visual hero */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: venue.image_url }}
          style={styles.coverImage}
          resizeMode="cover"
        />

        {/* Status Badge */}
        {venue.is_open_today ? (
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Aberto hoje</Text>
          </View>
        ) : null}

        {/* Multi-sport tags wrapper (max 2 + tooltip popover) */}
        {sportsList.length > 0 ? (
          <View style={styles.sportsContainer}>
            <SportsBadgeGroup sports={sportsList} maxVisible={2} />
          </View>
        ) : null}
      </View>

      {/* Card Content Body */}
      <View style={styles.contentBody}>
        {/* Header Info */}
        <View style={styles.titleRow}>
          <Text style={styles.venueName} numberOfLines={1}>
            {venue.name}
          </Text>
          <RatingBadge rating={venue.rating} reviewCount={venue.review_count} />
        </View>

        {/* Location Info */}
        <View style={styles.locationRow}>
          <MapPin size={13} color={theme.colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {venue.address ? `${venue.address} • ` : ''}{venue.city}, {venue.state}
          </Text>
        </View>

        {/* Key amenities as subtle icon rows */}
        {venue.amenities && venue.amenities.length > 0 ? (
          <View style={styles.amenitiesContainer}>
            {venue.amenities.slice(0, 3).map((item, idx) => (
              <AmenityChip key={idx} label={item} />
            ))}
            {venue.amenities.length > 3 ? (
              <Text style={styles.moreAmenities}>+{venue.amenities.length - 3}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Footer Info (Price + CTA) */}
        <View style={styles.cardFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>a partir de</Text>
            <View style={styles.priceRow}>
              <Text style={styles.currency}>R$</Text>
              <Text style={styles.priceValue}>
                {venue.starting_price ? Math.round(venue.starting_price) : '120'}
              </Text>
              <Text style={styles.perHour}>/hora</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onPress && onPress(venue)}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>
              {courtsCount > 1
                ? `Ver ${courtsCount} quadras`
                : courtsCount === 1
                ? 'Ver 1 quadra'
                : 'Ver quadras'}
            </Text>
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
    height: 215,
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
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    gap: 6,
    zIndex: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.success,
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
    padding: theme.spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  venueName: {
    flex: 1,
    fontSize: theme.typography.sizes.h3,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
    marginRight: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: 5,
  },
  locationText: {
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 6,
    marginBottom: theme.spacing.md,
  },
  moreAmenities: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
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