import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Edit3, Trash2, ShieldCheck, Sun, Umbrella, Users, DollarSign, Clock, Zap } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';

export function ManagerCourtCard({ court, onEdit, onDelete, onOpenHours, onOpenPricing }) {
  const { colors } = useTheme();

  const sportsList = Array.isArray(court.sports)
    ? court.sports.map((s) => (typeof s === 'object' ? s.name : s))
    : court.type
    ? court.type.split('•').map((s) => s.trim())
    : ['Futebol'];

  const formattedPrice = court.hourly_rate
    ? Number(court.hourly_rate).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '150,00';

  const rulesCount = (court.pricing_rules?.length || court.pricingRules?.length || 0);
  const specialCount = (court.special_prices?.length || court.specialPrices?.length || 0);
  const hasFlexiblePricing = rulesCount > 0 || specialCount > 0;

  return (
    <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Imagem / Header da Quadra */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri:
              court.image_url ||
              'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
          }}
          style={styles.courtImage}
          resizeMode="cover"
        />
        {/* Badge de Cobertura */}
        <View
          style={[
            styles.coverageBadge,
            { backgroundColor: court.is_covered ? colors.primary : '#EAB308' },
          ]}
        >
          {court.is_covered ? <Umbrella size={12} color="#FFFFFF" /> : <Sun size={12} color="#FFFFFF" />}
          <Text style={styles.coverageText}>{court.is_covered ? 'Coberta' : 'Descoberta'}</Text>
        </View>

        {/* Price Badge Overlay */}
        <View style={[styles.priceTag, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
          <Text style={[styles.priceLabel, { color: colors.primary }]}>R$ {formattedPrice}</Text>
          <Text style={[styles.priceUnit, { color: colors.textMuted }]}>/h</Text>
        </View>
      </View>

      {/* Conteúdo Principal */}
      <View style={styles.cardContent}>
        <Text style={[styles.courtName, { color: colors.text }]} numberOfLines={2}>
          {court.name}
        </Text>

        {/* Modalidades Badges */}
        <View style={styles.sportsRow}>
          {sportsList.map((sportName, idx) => (
            <View
              key={idx}
              style={[
                styles.sportChip,
                { backgroundColor: colors.primary + '14', borderColor: colors.primary + '30' },
              ]}
            >
              <Text style={[styles.sportChipText, { color: colors.primary }]}>{sportName}</Text>
            </View>
          ))}

          {hasFlexiblePricing ? (
            <View
              style={[
                styles.sportChip,
                { backgroundColor: '#EAB30818', borderColor: '#EAB30850', flexDirection: 'row', alignItems: 'center', gap: 3 },
              ]}
            >
              <Zap size={11} color="#EAB308" />
              <Text style={[styles.sportChipText, { color: colors.text }]}>
                Tarifa Flexível ({rulesCount + specialCount})
              </Text>
            </View>
          ) : null}
        </View>

        {/* Detalhes de Superfície e Capacidade */}
        <View style={styles.detailsRow}>
          {court.surface ? (
            <View style={styles.detailItem}>
              <ShieldCheck size={14} color={colors.textMuted} />
              <Text style={[styles.detailText, { color: colors.textMuted }]}>{court.surface}</Text>
            </View>
          ) : null}

          {court.capacity ? (
            <View style={styles.detailItem}>
              <Users size={14} color={colors.textMuted} />
              <Text style={[styles.detailText, { color: colors.textMuted }]}>{court.capacity}</Text>
            </View>
          ) : null}
        </View>

        {/* Botões de Ação para o Gestor */}
        <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => onEdit && onEdit(court)}
            style={[styles.btnAction, { backgroundColor: colors.primary + '15' }]}
          >
            <Edit3 size={15} color={colors.primary} />
            <Text style={[styles.btnActionText, { color: colors.primary }]}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => onOpenHours && onOpenHours(court)}
            style={[styles.btnAction, { backgroundColor: colors.primary + '15' }]}
          >
            <Clock size={15} color={colors.primary} />
            <Text style={[styles.btnActionText, { color: colors.primary }]}>Horários</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => onOpenPricing && onOpenPricing(court)}
            style={[styles.btnAction, { backgroundColor: colors.primary + '15' }]}
          >
            <DollarSign size={15} color={colors.primary} />
            <Text style={[styles.btnActionText, { color: colors.primary }]}>Preços</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => onDelete && onDelete(court)}
            style={[styles.btnDelete, { backgroundColor: colors.error + '15' }]}
          >
            <Trash2 size={15} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  imageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  courtImage: {
    width: '100%',
    height: '100%',
  },
  coverageBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    gap: 4,
  },
  coverageText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
  },
  priceTag: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.md,
  },
  priceLabel: {
    fontSize: theme.typography.sizes.body1,
    fontWeight: '700',
  },
  priceUnit: {
    fontSize: theme.typography.sizes.caption,
    marginLeft: 2,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  courtName: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  sportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  sportChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
  },
  sportChipText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 6,
    marginBottom: theme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: theme.typography.sizes.caption,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    gap: theme.spacing.sm,
  },
  btnAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    gap: 6,
  },
  btnActionText: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
  },
  btnDelete: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
