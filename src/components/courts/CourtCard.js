import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { ShieldCheck, SunMedium, Layers, Clock } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { SportsBadgeGroup } from '../common/SportsBadgeGroup';
import { optimizeImageUrl } from '../../utils/imageUtils';
import { formatBRL } from '../../utils/payment';

/**
 * Card de quadra da lista pública.
 * `availability` (opcional) = { freeCount, minPrice } — resumo de hoje
 * buscado pela tela pai: mostra "N horários livres hoje" e "a partir de R$ X"
 * sem precisar abrir a quadra.
 */
export function CourtCard({ court, onSelectCourt, availability = null }) {
  const { colors } = useTheme();

  if (!court) return null;

  const sportsList = court.sports && court.sports.length > 0
    ? court.sports
    : (court.type ? court.type.split('•').map(s => s.trim()) : []);

  const minPrice = availability?.minPrice != null
    ? availability.minPrice
    : court.hourly_rate != null
    ? parseFloat(court.hourly_rate)
    : null;

  return (
    <TouchableOpacity
      activeOpacity={0.94}
      onPress={() => onSelectCourt && onSelectCourt(court)}
      style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
      accessibilityRole="button"
      accessibilityLabel={`Ver horários da ${court.name}`}
    >
      {/* Court Cover Image Header */}
      <View style={[styles.imageWrapper, { backgroundColor: colors.backgroundSecondary }]}>
        <Image
          source={{
            uri: optimizeImageUrl(court.image_url, { width: 1400, quality: 90 }),
          }}
          style={styles.coverImage}
          resizeMode="cover"
          alt={`Foto da ${court.name}`}
          accessibilityLabel={`Foto da ${court.name}`}
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

        {/* Availability badge (hoje) */}
        {availability?.freeCount != null ? (
          <View style={[styles.availabilityBadge, { backgroundColor: availability.freeCount > 0 ? 'rgba(16, 185, 129, 0.92)' : 'rgba(15, 23, 42, 0.78)' }]}>
            <Clock size={12} color="#FFFFFF" />
            <Text style={styles.availabilityText}>
              {availability.freeCount > 0
                ? `${availability.freeCount} horários livres hoje`
                : 'Sem horários livres hoje'}
            </Text>
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
        </View>

        {/* Spec Pills & Details */}
        <View style={styles.specsContainer}>
          {court.surface ? (
            <View style={[styles.specChip, { backgroundColor: colors.backgroundSecondary }]}>
              <Layers size={13} color={colors.textMuted} />
              <Text style={[styles.specChipText, { color: colors.textSecondary }]}>{court.surface}</Text>
            </View>
          ) : null}

          {/* Preço "a partir de" + esportes ficam no hero — não repetir aqui */}
          {minPrice != null && minPrice > 0 ? (
            <View style={[styles.specChip, styles.priceChip, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.priceChipText, { color: colors.primary }]}>
                a partir de {formatBRL(minPrice)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Footer Info (CTA) - full width para equilibrar o card */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onSelectCourt && onSelectCourt(court)}
            style={[styles.ctaButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>Ver horários</Text>
            <View style={styles.ctaArrow}>
              <Text style={styles.ctaArrowText}>›</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: theme.radius.lg,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    overflow: 'visible',
    ...theme.shadows.sm,
  },
  imageWrapper: {
    position: 'relative',
    height: 180,
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
  availabilityBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    gap: 6,
    zIndex: 1,
  },
  availabilityText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
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
  priceChip: {},
  priceChipText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '800',
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
    minHeight: 46,
    ...theme.shadows.sm,
    elevation: 3,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.button,
    fontWeight: '700',
  },
  ctaArrow: {
    marginLeft: 4,
  },
  ctaArrowText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
});
