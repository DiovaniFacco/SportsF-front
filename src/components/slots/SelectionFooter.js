import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Trash2, User, MessageCircle, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { formatBRL } from '../../utils/payment';

/**
 * Barra fixa inferior com o resumo da seleção ("carrinho").
 * Suporta seleção em vários dias: mostra "X horários em Y dias" e agrupa
 * os horários por data. Campo de nome opcional (modo WhatsApp) é lembrado
 * no aparelho pelo responsável por persisti-lo.
 */
export function SelectionFooter({
  selectedSlots = [],
  selectedDate,
  courtName,
  confirmLabel = 'Agendar',
  confirmIcon: ConfirmIcon = null,
  showNameField = false,
  nameValue = '',
  onNameChange,
  onClearSelection,
  onConfirmSelection,
}) {
  const { colors } = useTheme();

  const count = selectedSlots.length;
  if (count === 0) return null;

  const totalPrice = selectedSlots.reduce(
    (acc, slot) => acc + (slot.price || 0),
    0
  );

  // Agrupa horários por dia (seleção multi-data) e soma o total.
  const byDate = new Map();
  selectedSlots.forEach((slot) => {
    const date = slot.bookingDate || selectedDate || '';
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(slot);
  });
  const days = Array.from(byDate.entries()).map(([date, slots]) => ({
    date,
    slots,
    times: slots.map((s) => s.formatted_time),
  }));

  const formattedDateParts = selectedDate ? selectedDate.split('-') : [];
  const dateFormatted = formattedDateParts.length === 3 ? `${formattedDateParts[2]}/${formattedDateParts[1]}/${formattedDateParts[0]}` : selectedDate;

  const handleConfirm = () => {
    if (onConfirmSelection) {
      onConfirmSelection(selectedSlots);
    } else {
      Alert.alert(
        'Horários Selecionados',
        `Quadra: ${courtName}\nData: ${dateFormatted}\nHorários: ${days.map((d) => d.times.join(', ')).join(' • ')}\nValor Total: ${formatBRL(totalPrice)}`,
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
                {days.length > 1 ? ` em ${days.length} dias` : ''}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClearSelection}
              style={styles.clearBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Limpar seleção"
            >
              <Trash2 size={13} color={colors.textMuted} />
              <Text style={[styles.clearText, { color: colors.textMuted }]}>Limpar</Text>
            </TouchableOpacity>
          </View>

          {/* Horários agrupados por dia (ou linha única quando é 1 dia) */}
          {days.length === 1 ? (
            <Text style={[styles.timesSummary, { color: colors.textPrimary }]} numberOfLines={1}>
              {days[0].times.join(', ')}
            </Text>
          ) : (
            <View>
              {days.map((d) => {
                const parts = d.date ? d.date.split('-') : [];
                const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.date;
                return (
                  <Text key={d.date} style={[styles.timesSummary, { color: colors.textPrimary }]} numberOfLines={1}>
                    {label}: {d.times.join(', ')}
                  </Text>
                );
              })}
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total:</Text>
            <Text style={[styles.totalPrice, { color: colors.primary }]}>
              {formatBRL(totalPrice)}
            </Text>
            {totalPrice > 0 ? (
              <Text style={[styles.depositText, { color: colors.textMuted }]}>
                (sinal {formatBRL(Math.round((totalPrice / 2) * 100) / 100)})
              </Text>
            ) : null}
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleConfirm}
          style={[styles.confirmButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel={confirmLabel}
        >
          {ConfirmIcon ? (
            <ConfirmIcon size={16} color={colors.white} style={{ marginRight: 4 }} />
          ) : (
            <CheckCircle size={16} color={colors.white} style={{ marginRight: 4 }} />
          )}
          <Text style={styles.confirmText}>{confirmLabel}</Text>
        </TouchableOpacity>
      </View>

      {/* Campo de nome (modo WhatsApp): lembra o cliente no aparelho */}
      {showNameField ? (
        <View style={[styles.nameFieldWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <User size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.nameInput, { color: colors.textPrimary }]}
            value={nameValue}
            onChangeText={onNameChange}
            placeholder="Seu nome (para o pedido)"
            placeholderTextColor={colors.textMuted}
            maxLength={60}
          />
        </View>
      ) : null}
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
    fontSize: theme.typography.sizes.label,
    fontWeight: '700',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minHeight: 44,
    justifyContent: 'center',
  },
  clearText: {
    fontSize: theme.typography.sizes.label,
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
    flexWrap: 'wrap',
  },
  totalLabel: {
    fontSize: theme.typography.sizes.bodySmall,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  depositText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '600',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: theme.radius.md,
    minHeight: 48,
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
  nameFieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 10,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
});
