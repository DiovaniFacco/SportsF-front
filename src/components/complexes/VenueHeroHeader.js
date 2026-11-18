import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Share2,
  Check,
  BadgeCheck,
  Info,
  ChevronDown,
  ChevronUp,
  MessageCircle,
} from 'lucide-react-native';
import * as WebLinking from 'expo-linking';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { AmenityChip } from '../common/AmenityChip';
import { SportsFLogo } from '../common/SportsFLogo';
import { SportsBadgeGroup } from '../common/SportsBadgeGroup';
import { optimizeImageUrl } from '../../utils/imageUtils';
import { shareVenueLink, buildTelUrl, buildMapsUrl } from '../../utils/linking';
import { getVenueWhatsappNumber } from '../../utils/whatsapp';
import { getTodayClosingHours } from '../../utils/datetime';

export function VenueHeroHeader({ venue, onBack, hideBack = false }) {
  const { colors } = useTheme();
  const [copiedToast, setCopiedToast] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(false);

  if (!venue) return null;

  const sportsList = venue.sports && venue.sports.length > 0 ? venue.sports : [];

  // O contato já aparece como link clicável abaixo do nome. Algumas descrições
  // repetem "Faça sua reserva pelo WhatsApp: (55) ..." — linha puramente de
  // contato é omitida do card de Informações para não duplicar o telefone.
  const isContactOnlyLine = (line) => /whats|telefone|contato/i.test(line)
    && /\d{4,5}[\s.-]?\d{4}/.test(line);

  const descriptionLines = (venue.description || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !isContactOnlyLine(line));

  // "Aberto hoje · até HH:MM": fechamento mais tarde entre as quadras hoje.
  const closingHours = venue.is_open_today ? getTodayClosingHours(venue) : null;

  // Telefones clicáveis: tel: e wa.me (quando há WhatsApp configurado).
  const telUrl = buildTelUrl(venue.phone);
  const waNumber = getVenueWhatsappNumber(venue);
  const waUrl = waNumber ? `https://wa.me/${waNumber}` : null;
  const mapsUrl = buildMapsUrl(venue);

  const openExternal = (url) => {
    if (!url) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      WebLinking.openURL(url).catch(() => {});
    }
  };

  const handleShare = async () => {
    const res = await shareVenueLink(venue);
    // Toast só quando copia (o seletor nativo já é feedback suficiente).
    if (res.success && res.method === 'copied') {
      setCopiedToast(true);
      setTimeout(() => {
        setCopiedToast(false);
      }, 3000);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
      {/* Toast Flutuante de Confirmação (não empurra o conteúdo) */}
      {copiedToast ? (
        <View style={[styles.toastBanner, { backgroundColor: colors.success }]} pointerEvents="none">
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
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <ArrowLeft size={18} color={colors.textPrimary} />
            <Text style={[styles.backText, { color: colors.textPrimary }]}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.navRightRow}>
            <View style={styles.logoContainer}>
              <SportsFLogo height={24} color={colors.primary} />
            </View>
          </View>
        </View>
      ) : (
        /* Modo link exclusivo: marca fora da imagem — barra própria, sem poluir o banner */
        <View style={[styles.brandBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
          <SportsFLogo height={22} color={colors.primary} />
          <View style={styles.brandBarRight}>
            <BadgeCheck size={14} color={colors.primary} />
            <Text style={[styles.brandBarText, { color: colors.textMuted }]}>Reserva oficial</Text>
          </View>
        </View>
      )}

      {/* Hero Cover Image Banner */}
      <View style={[styles.heroWrapper, { backgroundColor: colors.backgroundSecondary }]}>
        <Image
          source={{ uri: optimizeImageUrl(venue.image_url, { width: 1600, quality: 90 }) }}
          style={styles.coverImage}
          resizeMode="cover"
          alt={`Foto do complexo ${venue.name}`}
          accessibilityLabel={`Foto do complexo ${venue.name}`}
        />

        {/* Floating Top Right Badge - Status ("Aberto hoje · até HH:MM") */}
        {venue.is_open_today ? (
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {closingHours ? `Aberto hoje · até ${closingHours}` : 'Aberto hoje'}
            </Text>
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
          <Text style={[styles.venueName, { color: colors.textPrimary }]} numberOfLines={2} accessibilityRole="header">
            {venue.name}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleShare}
            style={[styles.iconShareBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Compartilhar link do complexo"
          >
            <Share2 size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Localização & contato — apenas os dois links essenciais:
            endereço abre o mapa e o telefone abre direto o WhatsApp. */}
        <View style={styles.metaContainer}>
          {mapsUrl ? (
            <View style={styles.metaRow}>
              <MapPin size={15} color={colors.primary} style={{ marginTop: 1 }} />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openExternal(mapsUrl)}
                accessibilityRole="link"
                accessibilityLabel="Abrir endereço no mapa"
                href={mapsUrl}
                target="_blank"
                style={styles.metaLink}
              >
                <Text style={[styles.metaText, styles.metaLinkText, { color: colors.textSecondary }]} numberOfLines={2}>
                  {venue.address ? `${venue.address} • ` : ''}{venue.city}, {venue.state}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.metaRow}>
              <MapPin size={15} color={colors.primary} style={{ marginTop: 1 }} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={2}>
                {venue.address ? `${venue.address} • ` : ''}{venue.city}, {venue.state}
              </Text>
            </View>
          )}

          {(waUrl || telUrl) ? (
            <View style={styles.metaRow}>
              {waUrl ? (
                <MessageCircle size={15} color={colors.teal || colors.primary} style={{ marginTop: 1 }} />
              ) : (
                <Phone size={15} color={colors.textMuted} style={{ marginTop: 1 }} />
              )}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openExternal(waUrl || telUrl)}
                accessibilityRole="link"
                accessibilityLabel={waUrl ? `Conversar no WhatsApp com ${venue.name}` : `Ligar para ${venue.name}`}
                href={waUrl || telUrl}
                target="_blank"
                style={styles.metaLink}
              >
                <Text
                  style={[
                    styles.metaText,
                    { color: waUrl ? (colors.teal || colors.primary) : colors.textPrimary, fontWeight: '700' },
                  ]}
                  numberOfLines={1}
                >
                  {venue.phone || waNumber}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Informações do complexo — resumo + "Ver regras completas" */}
        {descriptionLines.length > 0 ? (
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                borderLeftColor: colors.primary,
              },
            ]}
          >
            <View style={styles.infoCardHeader}>
              <Info size={16} color={colors.primary} />
              <Text style={[styles.infoCardTitle, { color: colors.textPrimary }]}>
                Informações
              </Text>
            </View>

            {(infoExpanded ? descriptionLines : descriptionLines.slice(0, 3)).map((line, index) => (
              <Text
                key={`${index}-${line}`}
                style={[styles.infoLine, { color: colors.textSecondary }]}
              >
                {line}
              </Text>
            ))}

            {descriptionLines.length > 3 ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setInfoExpanded((v) => !v)}
                style={styles.infoToggleBtn}
                accessibilityRole="button"
                accessibilityLabel={infoExpanded ? 'Ver menos regras' : 'Ver regras completas'}
              >
                <Text style={[styles.infoToggleText, { color: colors.primary }]}>
                  {infoExpanded ? 'Ver menos' : 'Ver regras completas'}
                </Text>
                {infoExpanded ? (
                  <ChevronUp size={14} color={colors.primary} />
                ) : (
                  <ChevronDown size={14} color={colors.primary} />
                )}
              </TouchableOpacity>
            ) : null}
          </View>
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
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    top: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
    zIndex: 50,
    elevation: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
    minHeight: 44,
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroWrapper: {
    position: 'relative',
    height: 232,
    width: '100%',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
    gap: 6,
    zIndex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: theme.radius.full,
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sportsContainer: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    zIndex: 1,
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
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaContainer: {
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  metaLink: {
    flex: 1,
  },
  metaLinkText: {
    textDecorationLine: 'underline',
  },
  metaText: {
    flex: 1,
    fontSize: theme.typography.sizes.body,
    fontWeight: '500',
  },
  infoCard: {
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoCardTitle: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  infoLine: {
    fontSize: theme.typography.sizes.body,
    lineHeight: 20,
    fontWeight: '500',
    paddingVertical: 3,
  },
  infoToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    minHeight: 40,
  },
  infoToggleText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '800',
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
  brandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  brandBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandBarText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
