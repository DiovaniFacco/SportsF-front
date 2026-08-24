import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { MapPin, ChevronRight, Share2, Check } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { AmenityChip } from '../common/AmenityChip';
import { SportsBadgeGroup } from '../common/SportsBadgeGroup';
import { optimizeImageUrl } from '../../utils/imageUtils';
import { shareVenueLink } from '../../utils/linking';

export function ComplexCard({ venue, onPress }) {
  const { colors } = useTheme();
  const [copiedToast, setCopiedToast] = useState(false);

  if (!venue) return null;

  const courtsCount = venue.courts_count || (venue.courts ? venue.courts.length : 0);
  const sportsList = venue.sports && venue.sports.length > 0 ? venue.sports : [];

  const handleShare = async (e) => {
    e?.stopPropagation && e.stopPropagation();
    const res = await shareVenueLink(venue);
    if (res.success) {
      setCopiedToast(true);
      setTimeout(() => {
        setCopiedToast(false);
      }, 3000);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.94}
      onPress={() => onPress && onPress(venue)}
      style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
    >
      {/* Toast Feedback */}
      {copiedToast ? (
        <View style={styles.toastBanner}>
          <Check size={14} color="#FFFFFF" />
          <Text style={styles.toastText}>Link do complexo copiado!</Text>
        </View>
      ) : null}

      {/* Cover Image */}
      <View style={[styles.imageWrapper, { backgroundColor: colors.backgroundSecondary }]}>
        <Image
          source={{ uri: optimizeImageUrl(venue.image_url, { width: 1400, quality: 90 }) }}
          style={styles.coverImage}
          resizeMode="cover"
        />

        {/* Status Badge */}
        {venue.is_open_today ? (
          <View style={[styles.statusBadge, { backgroundColor: colors.statusBadgeBg }]}>
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <Text style={styles.statusText}>Aberto hoje</Text>
          </View>
        ) : null}

        {/* Multi-sport tags wrapper */}
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
          <Text style={[styles.venueName, { color: colors.textPrimary }]} numberOfLines={1}>
            {venue.name}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleShare}
            style={[styles.shareCardBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
            accessibilityLabel="Compartilhar link do complexo"
          >
            <Share2 size={15} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Location Info */}
        <View style={styles.locationRow}>
          <MapPin size={13} color={colors.primary} />
          <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
            {venue.address ? `${venue.address} • ` : ''}{venue.city}, {venue.state}
          </Text>
        </View>

        {/* Key amenities */}
        {venue.amenities && venue.amenities.length > 0 ? (
          <View style={styles.amenitiesContainer}>
            {venue.amenities.slice(0, 3).map((item, idx) => (
              <AmenityChip key={idx} label={item} />
            ))}
            {venue.amenities.length > 3 ? (
              <Text style={[styles.moreAmenities, { color: colors.textMuted }]}>+{venue.amenities.length - 3}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Footer Info (Price + CTA) */}
        <View style={[styles.cardFooter, { borderTopColor: colors.borderSubtle }]}>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceLabel, { color: colors.textMuted }]}>a partir de</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.currency, { color: colors.primary }]}>R$</Text>
              <Text style={[styles.priceValue, { color: colors.textPrimary }]}>
                {venue.starting_price ? Math.round(venue.starting_price) : '120'}
              </Text>
              <Text style={[styles.perHour, { color: colors.textSecondary }]}>/hora</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onPress && onPress(venue)}
            style={[styles.ctaButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
          >
            <Text style={styles.ctaText}>
              {courtsCount > 1
                ? `Ver ${courtsCount} quadras`
                : courtsCount === 1
                ? 'Ver 1 quadra'
                : 'Ver quadras'}
            </Text>
            <ChevronRight size={14} color={colors.white} style={{ marginLeft: 2 }} />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  imageWrapper: {
    position: 'relative',
    height: 215,
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: theme.radius.full,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  sportsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    zIndex: 10,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
    letterSpacing: -0.3,
    marginRight: 8,
  },
  shareCardBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: 5,
  },
  locationText: {
    fontSize: theme.typography.sizes.bodySmall,
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
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    gap: 8,
    flexWrap: 'wrap',
  },
  priceContainer: {
    justifyContent: 'center',
    flexShrink: 1,
  },
  priceLabel: {
    fontSize: 11,
    marginBottom: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 2,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  perHour: {
    fontSize: 11,
    marginLeft: 2,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radius.md,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    flexShrink: 0,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});