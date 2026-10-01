import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { ArrowLeft, MapPin, Phone, Share2, Check } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { AmenityChip } from '../common/AmenityChip';
import { SportsFLogo } from '../common/SportsFLogo';
import { SportsBadgeGroup } from '../common/SportsBadgeGroup';
import { optimizeImageUrl } from '../../utils/imageUtils';
import { shareVenueLink } from '../../utils/linking';

export function VenueHeroHeader({ venue, onBack, hideBack = false }) {
  const { colors } = useTheme();
  const [copiedToast, setCopiedToast] = useState(false);

  if (!venue) return null;

  const sportsList = venue.sports && venue.sports.length > 0 ? venue.sports : [];

  const handleShare = async () => {
    const res = await shareVenueLink(venue);
    if (res.success) {
      setCopiedToast(true);
      setTimeout(() => {
        setCopiedToast(false);
      }, 3000);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
      {/* Toast Feedback de Confirmação */}
      {copiedToast ? (
        <View style={[styles.toastBanner, { backgroundColor: colors.success }]}>
          <Check size={16} color={colors.white} />
          <Text style={styles.toastText}>Link direto do complexo copiado!</Text>
        </View>
      ) : null}

      {/* Top Navigation Header with SportsF Brand Identity (oculto no link exclusivo simplificado) */}
      {!hideBack ? (
        <View style={[styles.topNavRow, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onBack}
            style={[styles.backButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          >
            <ArrowLeft size={18} color={colors.textPrimary} />
            <Text style={[styles.backText, { color: colors.textPrimary }]}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.navRightRow}>
            <View style={styles.logoContainer}>
              <SportsFLogo height={28} color={colors.primary} />
            </View>
          </View>
        </View>
      ) : null}

      {/* Hero Cover Image Banner */}
      <View style={[styles.heroWrapper, { backgroundColor: colors.backgroundSecondary }]}>
        <Image
          source={{ uri: optimizeImageUrl(venue.image_url, { width: 1600, quality: 90 }) }}
          style={styles.coverImage}
          resizeMode="cover"
        />

        {/* Marca SportsF flutuante no modo link exclusivo (sem a barra branca vazia) */}
        {hideBack ? (
          <View style={styles.brandOverlay}>
            <SportsFLogo height={18} color={colors.primary} />
          </View>
        ) : null}

        {/* Floating Top Right Badge - Status */}
        {venue.is_open_today ? (
          <View style={[styles.statusBadge, { backgroundColor: colors.statusBadgeBg }]}>
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <Text style={styles.statusText}>Aberto hoje</Text>
          </View>
        ) : null}

        {/* Floating Bottom Left Badge - Multi-Sport Tags */}
        {sportsList.length > 0 ? (
          <View style={styles.sportsContainer}>
            <SportsBadgeGroup sports={sportsList} maxVisible={2} />
          </View>
        ) : null}
      </View>

      {/* Main Complex Info Content */}
      <View style={styles.infoBody}>
        {/* Title & Share Icon Button */}
        <View style={styles.titleRow}>
          <Text style={[styles.venueName, { color: colors.textPrimary }]} numberOfLines={2}>
            {venue.name}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleShare}
            style={[styles.iconShareBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
            accessibilityLabel="Compartilhar link do complexo"
          >
            <Share2 size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Location & Contact Meta */}
        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <MapPin size={15} color={colors.primary} style={{ marginTop: 1 }} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={2}>
              {venue.address ? `${venue.address} • ` : ''}{venue.city}, {venue.state}
            </Text>
          </View>

          {venue.phone ? (
            <View style={styles.metaRow}>
              <Phone size={14} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{venue.phone}</Text>
            </View>
          ) : null}
        </View>

        {/* Descrição do complexo */}
        {venue.description?.trim() ? (
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            {venue.description.trim()}
          </Text>
        ) : null}

        {/* Amenity Chips */}
        {venue.amenities && venue.amenities.length > 0 ? (
          <View style={[styles.amenitiesContainer, { borderTopColor: colors.borderSubtle }]}>
            {venue.amenities.map((item, idx) => (
              <AmenityChip key={idx} label={item} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    marginBottom: theme.spacing.md,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.md,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.label,
    fontWeight: '700',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 10 : 12,
    paddingBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  backText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '700',
  },
  navRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
  },
  shareText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '700',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroWrapper: {
    position: 'relative',
    height: 200,
    width: '100%',
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
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
  },
  sportsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    zIndex: 10,
  },
  infoBody: {
    padding: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: theme.spacing.sm,
  },
  venueName: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  iconShareBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaContainer: {
    gap: 6,
    marginBottom: theme.spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  metaText: {
    flex: 1,
    fontSize: theme.typography.sizes.body,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: theme.typography.sizes.body,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 8,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
  },
  brandOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    zIndex: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
