import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { CheckCircle, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';

export function SelectionFooter({ selectedSlots, selectedDate, courtName, confirmLabel = 'Agendar', onClearSelection, onConfirmSelection }) {
  const { colors } = useTheme();

  const count = selectedSlots.length;
  if (count === 0) return null;

  const totalPrice = selectedSlots.reduce((acc, slot) => acc + (slot.price || 0), 0);
  const formattedDateParts = selectedDate ? selectedDate.split('-') : [];
  const dateFormatted = formattedDateParts.length === 3 ? `${formattedDateParts[2]}/${formattedDateParts[1]}/${formattedDateParts[0]}` : selectedDate;

  const timesText = selectedSlots.map(s => s.formatted_time).join(', ');

  const handleConfirm = () => {
    if (onConfirmSelection) {
      onConfirmSelection(selectedSlots);
    } else {
      Alert.alert(
        'Horários Selecionados',
        `Quadra: ${courtName}\nData: ${dateFormatted}\nHorários: ${timesText}\nValor Total: R$ ${Math.round(totalPrice)},00\n\n(Nesta etapa do protótipo, os horários foram selecionados e validados).`,
        [{ text: 'Perfeito', style: 'default' }]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <View style={styles.content}>
        {/* Info Column */}
        <View style={styles.infoCol}>
          <View style={styles.countRow}>
            <View style={[styles.countBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.countBadgeText, { color: colors.primary }]}>
                {count} {count === 1 ? 'horário' : 'horários'}
              </Text>
            </View>

            <TouchableOpacity onPress={onClearSelection} style={styles.clearBtn} activeOpacity={0.7}>
              <Trash2 size={13} color={colors.textMuted} />
              <Text style={[styles.clearText, { color: colors.textMuted }]}>Limpar</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.timesSummary, { color: colors.textPrimary }]} numberOfLines={1}>
            {timesText}
          </Text>

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total:</Text>
            <Text style={[styles.totalPrice, { color: colors.primary }]}>
              R$ {Math.round(totalPrice)}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleConfirm}
          style={[styles.confirmButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        >
          <Text style={styles.confirmText}>{confirmLabel}</Text>
          <CheckCircle size={16} color={colors.white} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoCol: {
    flex: 1,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  countBadgeText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  clearText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
  timesSummary: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '700',
    marginVertical: 1,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  totalLabel: {
    fontSize: theme.typography.sizes.bodySmall,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.button,
    fontWeight: '700',
  },
});
