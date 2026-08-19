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
            <Check size={14} color="#FFFFFF" strokeWidth={3} />
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
    width: '48%',
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    justifyContent: 'space-between',
    minHeight: 74,
  },
  selectedShadow: {
    shadowColor: '#881337',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
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
    letterSpacing: -0.2,
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    fontSize: 11,
    fontWeight: '700',
    marginRight: 2,
  },
  priceValue: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '800',
  },
  unavailableText: {
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
