import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Check, Lock } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';

export function SlotCard({ slot, isSelected, onToggleSelect }) {
  const { colors } = useTheme();

  if (!slot) return null;

  const isAvailable = slot.available;
  const isBlocked = slot.blocked;

  const handlePress = () => {
    if (isAvailable && onToggleSelect) {
      onToggleSelect(slot);
    }
  };

  // Definir estilo com base no estado
  let cardBg = colors.surface;
  let borderColor = colors.border;
  let timeTextColor = colors.textPrimary;
  let priceTextColor = colors.primary;

  if (isSelected) {
    cardBg = colors.primary;
    borderColor = colors.primary;
    timeTextColor = '#FFFFFF';
    priceTextColor = '#FFFFFF';
  } else if (!isAvailable) {
    cardBg = colors.backgroundSecondary;
    borderColor = colors.borderSubtle;
    timeTextColor = colors.textDisabled;
    priceTextColor = colors.textMuted;
  }

  return (
    <TouchableOpacity
      activeOpacity={isAvailable ? 0.75 : 1.0}
      onPress={handlePress}
      disabled={!isAvailable}
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: borderColor,
        },
        isSelected && styles.selectedShadow,
        !isAvailable && styles.disabledCard,
      ]}
    >
      {/* Top Header: Check Icon / Lock Icon / Status */}
      <View style={styles.cardHeader}>
        <Text style={[styles.timeText, { color: timeTextColor }]}>
          {slot.formatted_time}
        </Text>

        {isSelected ? (
          <View style={styles.checkBadge}>
            <Check size={14} color={colors.white} strokeWidth={3} />
          </View>
        ) : !isAvailable ? (
          <View style={styles.lockedBadge}>
            <Lock size={12} color={colors.textMuted} />
          </View>
        ) : null}
      </View>

      {/* Bottom Footer: Preço ou Razão do Bloqueio */}
      <View style={styles.cardFooter}>
        {isAvailable ? (
          <View style={styles.priceRow}>
            <Text style={[styles.priceCurrency, { color: priceTextColor }]}>R$</Text>
            <Text style={[styles.priceValue, { color: priceTextColor }]}>
              {Math.round(slot.price)}
            </Text>
          </View>
        ) : (
          <Text style={[styles.unavailableText, { color: colors.textMuted }]} numberOfLines={1}>
            {isBlocked ? slot.block_reason || 'Bloqueado' : 'Reservado'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    justifyContent: 'space-between',
    minHeight: 56,
  },
  selectedShadow: {
    ...theme.shadows.md,
  },
  disabledCard: {
    opacity: 0.65,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timeText: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '700',
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceCurrency: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
    marginRight: 2,
  },
  priceValue: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '800',
  },
  unavailableText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
