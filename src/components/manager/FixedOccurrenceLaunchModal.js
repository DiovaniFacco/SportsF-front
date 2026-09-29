import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { X, User, Phone, FileText, CheckCircle2, Banknote, Repeat } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import {
  launchFixedScheduleDay,
  weekdayLabel,
  formatTime,
  formatDateBR,
  extractApiError,
} from '../../api/fixedSchedules';
import { formatBRL, parseBRLInput } from '../../utils/payment';

/**
 * Lança UMA ocorrência do horário fixo como agendamento normal:
 * cria o booking do dia (com pago/pendente/não pago), sem remover a série.
 * A reserva passa a contar em Agendamentos, Métricas e Faturamento.
 */
export function FixedOccurrenceLaunchModal({
  visible,
  onClose,
  courts = [],
  fixed = null,
  date = null, // ocorrência YYYY-MM-DD
  onSuccess,
}) {
  const { colors } = useTheme();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paidInput, setPaidInput] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (visible && fixed) {
      setCustomerName(fixed.customer_name || '');
      setCustomerPhone(fixed.customer_phone || '');
      setNotes('');
      setPaidInput('0');
      setErrorMessage('');
    }
  }, [visible, fixed]);

  if (!visible) return null;

  const court = courts.find((c) => String(c?.id) === String(fixed?.court_id));
  const rate = court?.hourly_rate != null ? Number(court.hourly_rate) : null;
  const toMin = (t) => {
    const m = String(t || '').match(/^(\d{1,2}):(\d{2})/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const sMin = toMin(fixed?.start_time);
  const eMin = toMin(fixed?.end_time);
  const hours = sMin != null && eMin != null && eMin > sMin ? (eMin - sMin) / 60 : 1;
  const expected = rate != null ? Math.round(rate * hours * 100) / 100 : null;

  const handleSubmit = async () => {
    if (!fixed?.id || !date) {
      setErrorMessage('Série ou data inválida.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMessage('Informe o nome do cliente.');
      return;
    }
    const paidAmount = parseBRLInput(paidInput);
    if (!Number.isFinite(paidAmount)) {
      setErrorMessage('Informe um valor pago válido (ex: 0, 40 ou 80).');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      await launchFixedScheduleDay(fixed.id, {
        courtId: fixed.court_id,
        date: String(date).substring(0, 10),
        startTime: formatTime(fixed.start_time),
        endTime: formatTime(fixed.end_time),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        paidAmount,
        notes: notes.trim() || null,
      });
      const status = expected != null && paidAmount >= expected
        ? 'PAGO'
        : paidAmount > 0 ? 'PENDENTE' : 'NÃO PAGO';
      const msg = `Dia ${formatDateBR(date)} lançado como ${status}! A série continua valendo.`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Sucesso', msg);
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMessage(extractApiError(err, 'Não foi possível lançar o dia.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Repeat size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Lançar dia do fixo</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  {fixed ? `Toda ${weekdayLabel(fixed.day_of_week, true)} • ${formatTime(fixed.start_time)} às ${formatTime(fixed.end_time)}` : ''}
                  {date ? ` • ${formatDateBR(date)}` : ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            >
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {errorMessage ? (
              <View style={[styles.errorBox, { backgroundColor: colors.errorSurface, borderColor: colors.error }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Nome do Cliente *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <User size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Ex: Time do João"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Telefone / WhatsApp (opcional)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Phone size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  placeholder="(11) 99999-0000"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Valor recebido neste dia (R$) *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Banknote size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={paidInput}
                  onChangeText={setPaidInput}
                  placeholder="Ex: 0, 40 ou 80"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <Text style={[styles.paymentHint, { color: colors.textMuted }]}>
                {expected != null ? `Valor estimado: ${formatBRL(expected)}.` : 'Informe quanto o cliente pagou.'}
                {(() => {
                  const paid = parseBRLInput(paidInput);
                  if (!Number.isFinite(paid) || paid === 0) return ' Ficará como NÃO PAGO.';
                  if (expected == null || paid < expected) return ' Ficará como PENDENTE.';
                  return ' Ficará como PAGO.';
                })()}
              </Text>
              <View style={styles.paymentRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setPaidInput('0')}
                  style={[styles.paymentBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <Text style={[styles.paymentBtnText, { color: colors.textSecondary }]}>Não pago</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => { if (expected != null) setPaidInput(String(expected)); }}
                  style={[styles.paymentBtn, { backgroundColor: colors.successSurface, borderColor: colors.success }]}
                >
                  <Banknote size={15} color={colors.success} style={{ marginRight: 6 }} />
                  <Text style={[styles.paymentBtnText, { color: colors.success }]}>Valor total</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Observações</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <FileText size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Ex: pago em dinheiro"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              disabled={submitting}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSubmit}
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <CheckCircle2 size={18} color={colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.submitBtnText}>Lançar dia</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  modalCard: {
    width: '96%',
    maxWidth: 520,
    maxHeight: '92%',
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: theme.typography.sizes.body, fontWeight: '800' },
  modalSubtitle: { fontSize: theme.typography.sizes.caption, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: theme.radius.full,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  formScroll: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md },
  errorBox: {
    padding: theme.spacing.sm, borderRadius: theme.radius.md,
    borderWidth: 1, marginBottom: theme.spacing.md,
  },
  errorText: { fontSize: theme.typography.sizes.caption, fontWeight: '600' },
  inputGroup: { marginBottom: theme.spacing.md },
  inputLabel: { fontSize: theme.typography.sizes.body, fontWeight: '700', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: theme.spacing.md, height: 44,
    borderRadius: theme.radius.md, borderWidth: 1,
  },
  input: { flex: 1, fontSize: theme.typography.sizes.body },
  paymentHint: { fontSize: theme.typography.sizes.caption, marginTop: 6 },
  paymentRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  paymentBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: theme.radius.md, borderWidth: 1,
  },
  paymentBtnText: { fontSize: theme.typography.sizes.body, fontWeight: '700' },
  modalFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 8, paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md, borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: theme.radius.md, borderWidth: 1,
  },
  cancelBtnText: { fontSize: theme.typography.sizes.label, fontWeight: '600' },
  submitBtn: {
    flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: theme.radius.md,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: theme.typography.sizes.label, fontWeight: '700' },
});
