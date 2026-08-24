import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { ArrowLeft, MapPin, Phone } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { AmenityChip } from '../common/AmenityChip';
import { SportsBadgeGroup } from '../common/SportsBadgeGroup';
import { optimizeImageUrl } from '../../utils/imageUtils';

export function VenueHeroHeader({ venue, onBack }) {
  const { colors } = useTheme();

  if (!venue) return null;

  const sportsList = venue.sports && venue.sports.length > 0 ? venue.sports : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
      {/* Top Navigation Header with SFACCO Brand Identity */}
      <View style={[styles.topNavRow, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onBack}
          style={[styles.backButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
        >
          <ArrowLeft size={18} color={colors.textPrimary} />
          <Text style={[styles.backText, { color: colors.textPrimary }]}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Text style={[styles.letraS, { color: colors.letraS }]}>S</Text>
          <Text style={[styles.brandName, { color: colors.brandName }]}>facco</Text>
        </View>
      </View>

      {/* Hero Cover Image Banner */}
      <View style={[styles.heroWrapper, { backgroundColor: colors.backgroundSecondary }]}>
        <Image
          source={{ uri: optimizeImageUrl(venue.image_url, { width: 1600, quality: 90 }) }}
          style={styles.coverImage}
          resizeMode="cover"
        />

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
        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={[styles.venueName, { color: colors.textPrimary }]} numberOfLines={2}>
            {venue.name}
          </Text>
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  letraS: {
    fontFamily:
      Platform.OS === 'web'
        ? "'Great Vibes', cursive, 'GreatVibes_400Regular'"
        : 'GreatVibes_400Regular',
    fontSize: 34,
    marginRight: -3,
    textShadowColor: 'rgba(136, 19, 55, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  brandName: {
    fontFamily:
      Platform.OS === 'web'
        ? "'Josefin Sans', sans-serif, 'JosefinSans_700Bold'"
        : 'JosefinSans_700Bold',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
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
    fontSize: 11,
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
    alignItems: 'flex-start',
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
  amenitiesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 8,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
  },
});
