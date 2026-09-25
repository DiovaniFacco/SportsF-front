import React, { useState, useEffect, useRef } from 'react';
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
import { X, User, Phone, FileText, CheckCircle2, ShieldAlert, Banknote } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { createBooking } from '../../api/bookings';
import { getTodayStrInSaoPaulo } from '../../utils/datetime';
import { formatBRL, parseBRLInput } from '../../utils/payment';
import { DatePickerInput } from '../common/DatePickerInput';
import { TimePickerInput } from '../common/TimePickerInput';

export function ManualBookingModal({
  visible,
  onClose,
  courts = [],
  onSuccess,
  initialCourtId = null,
  initialStartTime = '18:00',
  initialEndTime = '19:00',
  initialDate = null,
  onOpenBlockModal,
}) {
  const { colors } = useTheme();

  const getTodayStr = () => getTodayStrInSaoPaulo();

  const [selectedCourtId, setSelectedCourtId] = useState(initialCourtId);
  const [date, setDate] = useState(initialDate || getTodayStr());
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paidInput, setPaidInput] = useState('0');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const formScrollRef = useRef(null);

  // Erro sempre visível: ao falhar, rola o formulário até o topo, onde está
  // a mensagem (telas pequenas escondiam o erro).
  useEffect(() => {
    if (errorMessage && formScrollRef.current?.scrollTo) {
      formScrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [errorMessage]);

  useEffect(() => {
    if (visible) {
      setSelectedCourtId(initialCourtId || (courts.length > 0 ? courts[0].id : null));
      setDate(initialDate || getTodayStr());
      setStartTime(initialStartTime || '18:00');
      setEndTime(initialEndTime || '19:00');
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      setPaidInput('0');
      setErrorMessage('');
    }
  }, [visible, courts, initialCourtId, initialStartTime, initialEndTime, initialDate]);

  const timeOptions = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  const handleSubmit = async () => {
    if (!selectedCourtId) {
      setErrorMessage('Selecione uma quadra para o agendamento.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMessage('Por favor, informe o nome do cliente.');
      return;
    }
    // Telefone é opcional (a API também aceita sem).
    if (!startTime || !endTime) {
      setErrorMessage('Informe o horário de início e término.');
      return;
    }
    if (startTime >= endTime) {
      setErrorMessage('O horário de término deve ser após o horário de início.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const fullStartTime = `${date} ${startTime.length === 5 ? startTime + ':00' : startTime}`;
      const fullEndTime = `${date} ${endTime.length === 5 ? endTime + ':00' : endTime}`;

      const paidAmount = parseBRLInput(paidInput);
      if (!Number.isFinite(paidAmount)) {
        setErrorMessage('Informe um valor pago válido (ex: 0, 40 ou 80).');
        setSubmitting(false);
        return;
      }

      await createBooking({
        courtId: selectedCourtId,
        startTime: fullStartTime,
        endTime: fullEndTime,
        isManual: true,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        notes: notes.trim() || 'Agendamento presencial / balcão',
        paidAmount,
      });

      const msg = 'Agendamento balcão realizado com sucesso!';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Sucesso', msg);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Erro ao criar agendamento manual:', err);
      // 422 de validação traz o detalhe em errors.* — mostra a 1ª mensagem útil.
      const errors = err.response?.data?.errors;
      const firstDetail = errors ? Object.values(errors).flat()[0] : null;
      const apiMsg =
        firstDetail ||
        err.response?.data?.message ||
        'Não foi possível salvar o agendamento. Verifique os dados.';
      setErrorMessage(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Top Bar */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Novo Agendamento Balcão</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                Reserva presencial ou via WhatsApp
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            >
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView ref={formScrollRef} style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {errorMessage ? (
              <View style={[styles.errorBox, { backgroundColor: colors.errorSurface, borderColor: colors.error }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Seleção de Quadra */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Quadra *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {courts.map((court) => {
                  const isSelected = selectedCourtId === court.id;
                  return (
                    <TouchableOpacity
                      key={court.id}
                      activeOpacity={0.7}
                      onPress={() => setSelectedCourtId(court.id)}
                      style={[
                        styles.chipBtn,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isSelected ? colors.white : colors.textPrimary },
                        ]}
                      >
                        {court.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Data */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Data *</Text>
              <DatePickerInput
                value={date}
                onChangeDate={setDate}
                colors={colors}
              />
            </View>

            {/* Horário Início e Término */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Início *</Text>
                <TimePickerInput
                  value={startTime}
                  onChangeTime={setStartTime}
                  colors={colors}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Término *</Text>
                <TimePickerInput
                  value={endTime}
                  onChangeTime={setEndTime}
                  colors={colors}
                />
              </View>
            </View>

            {/* Dados do Cliente */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Nome do Cliente *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <User size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Ex: João da Silva (Balcão)"
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
                  placeholder="Ex: (54) 99988-7766"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Observações */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Observações</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border, height: 70, alignItems: 'flex-start', paddingTop: 10 }]}>
                <FileText size={18} color={colors.textMuted} style={{ marginRight: 10, marginTop: 2 }} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, textAlignVertical: 'top' }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Ex: Pago em dinheiro / Equipamento alugado"
                  multiline
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Pagamento: quanto já foi recebido */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Valor já recebido (R$) *</Text>
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
              {(() => {
                const selectedCourt = courts.find((c) => String(c.id) === String(selectedCourtId));
                const rate = selectedCourt?.hourly_rate != null ? Number(selectedCourt.hourly_rate) : null;
                const paid = parseBRLInput(paidInput);
                const preview = Number.isFinite(paid) ? ' • ' : '';
                return (
                  <Text style={[styles.paymentHint, { color: colors.textMuted }]}>
                    {rate != null ? `Valor da quadra/hora: ${formatBRL(rate)}.` : 'Informe quanto o cliente já pagou.'}
                    {Number.isFinite(paid) && paid === 0 ? ' Ficará como NÃO PAGO.' : ''}
                    {Number.isFinite(paid) && paid > 0 && (rate == null || paid < rate) ? ' Ficará como PENDENTE (pagamento parcial).' : ''}
                    {Number.isFinite(paid) && rate != null && paid >= rate ? ' Ficará como PAGO (valor integral).' : ''}
                    {preview === '' && !Number.isFinite(paid) ? ' Valor inválido.' : ''}
                  </Text>
                );
              })()}
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
                  onPress={() => {
                    const selectedCourt = courts.find((c) => String(c.id) === String(selectedCourtId));
                    const rate = selectedCourt?.hourly_rate != null ? Number(selectedCourt.hourly_rate) : null;
                    if (rate != null) setPaidInput(String(rate));
                  }}
                  style={[styles.paymentBtn, { backgroundColor: colors.successSurface, borderColor: colors.success }]}
                >
                  <Banknote size={15} color={colors.success} style={{ marginRight: 6 }} />
                  <Text style={[styles.paymentBtnText, { color: colors.success }]}>Valor total</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              disabled={submitting}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>Cancelar</Text>
            </TouchableOpacity>

            {onOpenBlockModal ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  onClose();
                  onOpenBlockModal({
                    courtId: selectedCourtId,
                    startTime,
                    endTime,
                    date,
                  });
                }}
                style={[
                  styles.blockBtn,
                  { backgroundColor: colors.errorSurface, borderColor: colors.error },
                ]}
                disabled={submitting}
              >
                <ShieldAlert size={16} color={colors.error} style={{ marginRight: 6 }} />
                <Text style={[styles.blockBtnText, { color: colors.error }]}>Bloquear Horário</Text>
              </TouchableOpacity>
            ) : null}

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
                  <Text style={styles.submitBtnText}>Confirmar Agendamento</Text>
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
    paddingHorizontal: theme.spacing.xs || 8,
    paddingVertical: theme.spacing.sm,
  },
  modalCard: {
    width: '96%',
    maxWidth: 560,
    maxHeight: '92%',
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
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
  modalTitle: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: theme.typography.sizes.caption,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  errorBox: {
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.sizes.body,
  },
  rowInputs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipScroll: {
    flexDirection: 'row',
    marginTop: 4,
  },
  chipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  paymentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  paymentBtnText: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '700',
  },
  paymentHint: {
    fontSize: theme.typography.sizes.caption,
    marginTop: 6,
  },
  quickLabel: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
    marginBottom: 6,
  },
  quickTimeScroll: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  quickTimeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    marginRight: 6,
  },
  quickTimeText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    minWidth: 75,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
  },
  blockBtn: {
    flex: 1.2,
    minWidth: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  blockBtnText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '700',
    textAlign: 'center',
  },
  submitBtn: {
    flex: 1.5,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '700',
    textAlign: 'center',
  },
});
