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
import { X, User, Phone, FileText, CheckCircle2, Banknote, Repeat } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { createBooking } from '../../api/bookings';
import { createFixedSchedule, launchFixedScheduleDay, weekdayLabel, extractApiError } from '../../api/fixedSchedules';
import { getTodayStrInSaoPaulo, parseDateTimeMs, intervalsOverlap, durationHoursBetween, formatDurationMinutes, timeStrToMinutes } from '../../utils/datetime';
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
  existingBookings = [],
  existingBlocks = [],
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
  // Modo horário fixo: em vez de 1 reserva avulsa, cria série semanal.
  const [isFixed, setIsFixed] = useState(false);

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
      setIsFixed(false);
      setErrorMessage('');
    }
  }, [visible, courts, initialCourtId, initialStartTime, initialEndTime, initialDate]);

  const timeOptions = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  // Dia da semana da data escolhida (0=dom .. 6=sáb) p/ o modo fixo.
  const weekdayOfDate = (iso) => {
    const parts = String(iso || '').substring(0, 10).split('-');
    if (parts.length !== 3) return null;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return Number.isNaN(d.getTime()) ? null : d.getDay();
  };

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
    // Duração livre: não precisa ser múltiplo do intervalo de exibição
    // (ex: 1h30 numa grade de 60min). Apenas valida sobreposição local
    // para feedback imediato — o backend é a autoridade final.
    const dayStr = String(date || '').substring(0, 10);
    const newStartMs = parseDateTimeMs(`${dayStr} ${startTime.length === 5 ? `${startTime}:00` : startTime}`);
    const newEndMs = parseDateTimeMs(`${dayStr} ${endTime.length === 5 ? `${endTime}:00` : endTime}`);
    if (!Number.isNaN(newStartMs) && !Number.isNaN(newEndMs)) {
      const conflictBooking = (existingBookings || []).find((b) => {
        if (!b || b.status === 'cancelled') return false;
        if (String(b.court_id ?? selectedCourtId) !== String(selectedCourtId)) return false;
        return intervalsOverlap(newStartMs, newEndMs, parseDateTimeMs(b.start_time), parseDateTimeMs(b.end_time));
      });
      if (conflictBooking) {
        const cs = String(conflictBooking.start_time || '').substring(11, 16);
        const ce = String(conflictBooking.end_time || '').substring(11, 16);
        setErrorMessage(`Conflito: já existe reserva das ${cs} às ${ce} neste intervalo. Ajuste o horário ou cancele a reserva existente.`);
        return;
      }
      const conflictBlock = (existingBlocks || []).find((b) => {
        if (!b || b.end_time == null) return false;
        if (String(b.court_id ?? selectedCourtId) !== String(selectedCourtId)) return false;
        return intervalsOverlap(newStartMs, newEndMs, parseDateTimeMs(b.start_time), parseDateTimeMs(b.end_time));
      });
      if (conflictBlock) {
        setErrorMessage(`Conflito: este intervalo está bloqueado (${conflictBlock.reason || 'manutenção'}). Escolha outro horário.`);
        return;
      }
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      // Modo horário fixo: cria a série semanal e já lança o dia escolhido
      // com o valor recebido (igual a um agendamento normal).
      if (isFixed) {
        const dow = weekdayOfDate(date);
        if (dow == null) {
          setErrorMessage('Data inválida para o horário fixo.');
          setSubmitting(false);
          return;
        }
        const paidAmount = parseBRLInput(paidInput);
        if (!Number.isFinite(paidAmount)) {
          setErrorMessage('Informe um valor pago válido (ex: 0, 40 ou 80).');
          setSubmitting(false);
          return;
        }
        const created = await createFixedSchedule({
          courtId: selectedCourtId,
          dayOfWeek: dow,
          startTime,
          endTime,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || null,
          validFrom: date.substring(0, 10),
          validUntil: null,
          notes: notes.trim() || null,
        });
        const createdId = created?.id;
        if (createdId) {
          try {
            await launchFixedScheduleDay(createdId, {
              courtId: selectedCourtId,
              date: date.substring(0, 10),
              startTime,
              endTime,
              customerName: customerName.trim(),
              customerPhone: customerPhone.trim() || null,
              paidAmount,
              notes: notes.trim() || `Primeiro dia do horário fixo`,
            });
          } catch (launchErr) {
            console.warn('Série fixa criada, falha ao lançar o dia:', launchErr);
            const detail = extractApiError?.(launchErr, 'não foi possível lançar o dia.') || 'não foi possível lançar o dia.';
            const msg = `Horário fixo criado: toda ${weekdayLabel(dow, true)} ${startTime} às ${endTime}. Porém o dia ${date.substring(0, 10)} ${detail} Lance manualmente na agenda.`;
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Série criada', msg);
            onSuccess?.();
            onClose();
            return;
          }
        }

        const statusHint = paidAmount > 0 ? ' Dia lançado com pagamento.' : ' Dia lançado como NÃO PAGO.';
        const msg = `Horário fixo criado: toda ${weekdayLabel(dow, true)} ${startTime} às ${endTime}.${statusHint}`;
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('Sucesso', msg);
        }

        onSuccess?.();
        onClose();
        return;
      }

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
        'Não foi possível salvar. Verifique os dados.';
      setErrorMessage(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  const fixedDow = isFixed ? weekdayOfDate(date) : null;

  // Estimativa de valor = tarifa/hora × duração (o total exato com preço de
  // pico/feriado é calculado no servidor, que recusa paid > total).
  const selectedCourtForPay = courts.find((c) => String(c.id) === String(selectedCourtId));
  const payRate = selectedCourtForPay?.hourly_rate != null ? Number(selectedCourtForPay.hourly_rate) : null;
  const toPayMinutes = (t) => {
    const m = String(t || '').match(/^(\d{1,2}):(\d{2})/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const payStartMin = toPayMinutes(startTime);
  const payEndMin = toPayMinutes(endTime);
  const payHours = payStartMin != null && payEndMin != null && payEndMin > payStartMin ? (payEndMin - payStartMin) / 60 : 1;
  const estimatedTotal = payRate != null ? Math.round(payRate * payHours * 100) / 100 : null;
  const estimatedHalf = estimatedTotal != null ? Math.round((estimatedTotal / 2) * 100) / 100 : null;
  const parsedPaid = parseBRLInput(paidInput);
  // Estado ativo de cada segmento (compara valores com tolerância de centavo)
  const segNoneActive = Number.isFinite(parsedPaid) && parsedPaid === 0;
  const segHalfActive = estimatedHalf != null && Number.isFinite(parsedPaid) && Math.abs(parsedPaid - estimatedHalf) < 0.005;
  const segTotalActive = estimatedTotal != null && Number.isFinite(parsedPaid) && Math.abs(parsedPaid - estimatedTotal) < 0.005;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Top Bar */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {isFixed ? 'Novo Horário Fixo' : 'Novo Agendamento Balcão'}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                {isFixed ? 'Repete toda semana até você excluir' : 'Reserva presencial ou via WhatsApp'}
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
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                {isFixed ? 'Vale a partir de *' : 'Data *'}
              </Text>
              <DatePickerInput
                value={date}
                onChangeDate={setDate}
                colors={colors}
              />
            </View>

            {/* Horário Início e Término — duração livre, não precisa seguir o slot */}
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
            {(() => {
              const sMin = timeStrToMinutes(startTime);
              const eMin = timeStrToMinutes(endTime);
              if (sMin == null || eMin == null || eMin <= sMin) return null;
              const durMin = eMin - sMin;
              const hours = durationHoursBetween(startTime, endTime);
              return (
                <Text style={[styles.paymentHint, { color: colors.textMuted, marginTop: -8, marginBottom: 12 }]}>
                  Duração: {formatDurationMinutes(durMin)}
                  {hours && hours % 1 !== 0 ? ' (não precisa ser múltiplo do intervalo de exibição)' : ''}.
                </Text>
              );
            })()}

            {/* Repetir toda semana (horário fixo) */}
            <View
              style={[
                styles.fixedBox,
                {
                  backgroundColor: isFixed ? colors.primaryLight : colors.background,
                  borderColor: isFixed ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={styles.fixedRow}>
                <View style={[styles.fixedIcon, { backgroundColor: isFixed ? colors.white : colors.primaryLight }]}>
                  <Repeat size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fixedTitle, { color: colors.textPrimary }]}>
                    Repetir toda semana
                  </Text>
                  <Text style={[styles.fixedDesc, { color: colors.textSecondary }]}>
                    {isFixed && fixedDow != null
                      ? `Toda ${weekdayLabel(fixedDow, true)} ${startTime} às ${endTime}, sem data final. O dia ${date.substring(0, 10)} já entra lançado com o valor abaixo.`
                      : 'Cria um horário fixo em vez de uma reserva única (o dia escolhido já entra lançado com pagamento).'}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: isFixed }}
                  onPress={() => setIsFixed((prev) => !prev)}
                  style={[
                    styles.toggleTrack,
                    {
                      backgroundColor: isFixed ? colors.primary : colors.border,
                      borderColor: isFixed ? colors.primary : colors.borderStrong,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      { backgroundColor: colors.white, alignSelf: isFixed ? 'flex-end' : 'flex-start' },
                    ]}
                  />
                </TouchableOpacity>
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
                  placeholder="Ex: (55) 99999-0000"
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

            {/* Pagamento: quanto já foi recebido (vale para avulsa e p/ o 1º dia do fixo) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                {isFixed ? 'Valor recebido neste dia (R$) *' : 'Valor já recebido (R$) *'}
              </Text>
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
                const over = Number.isFinite(parsedPaid) && estimatedTotal != null && parsedPaid > estimatedTotal;
                return (
                  <Text style={[styles.paymentHint, { color: colors.textMuted }]}>
                    {estimatedTotal != null ? `Valor estimado: ${formatBRL(estimatedTotal)} (${formatBRL(payRate)} × ${payHours}h).` : 'Informe quanto o cliente já pagou.'}
                    {Number.isFinite(parsedPaid) && parsedPaid === 0 ? ' Ficará como NÃO PAGO.' : ''}
                    {Number.isFinite(parsedPaid) && parsedPaid > 0 && (estimatedTotal == null || parsedPaid < estimatedTotal) ? ' Ficará como PENDENTE (pagamento parcial).' : ''}
                    {Number.isFinite(parsedPaid) && estimatedTotal != null && parsedPaid === estimatedTotal ? ' Ficará como PAGO (valor integral).' : ''}
                    {over ? ` Valor acima do estimado — o sistema não aceita valor maior que o total.` : ''}
                    {!Number.isFinite(parsedPaid) ? ' Valor inválido.' : ''}
                  </Text>
                );
              })()}
              {/* Controle segmentado: Não pago | Sinal 50% | Total — um toque define o valor */}
              <View style={[styles.segmentedRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
                {[
                  {
                    key: 'none',
                    label: 'Não pago',
                    active: segNoneActive,
                    onPress: () => setPaidInput('0'),
                  },
                  {
                    key: 'half',
                    label: estimatedHalf != null ? `Sinal 50% (${formatBRL(estimatedHalf)})` : 'Sinal 50%',
                    active: segHalfActive,
                    onPress: () => estimatedHalf != null && setPaidInput(String(estimatedHalf)),
                  },
                  {
                    key: 'total',
                    label: estimatedTotal != null ? `Total (${formatBRL(estimatedTotal)})` : 'Total',
                    active: segTotalActive,
                    onPress: () => estimatedTotal != null && setPaidInput(String(estimatedTotal)),
                  },
                ].map((seg) => (
                  <TouchableOpacity
                    key={seg.key}
                    activeOpacity={0.8}
                    onPress={seg.onPress}
                    accessibilityRole="button"
                    accessibilityState={{ selected: seg.active }}
                    style={[
                      styles.segmentedBtn,
                      seg.active && { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[styles.segmentedText, { color: seg.active ? colors.white : colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {seg.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons — bloquear horário é feito pela agenda (ação "Bloquear Horários") */}
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
                  {isFixed ? (
                    <Repeat size={18} color={colors.white} style={{ marginRight: 6 }} />
                  ) : (
                    <CheckCircle2 size={18} color={colors.white} style={{ marginRight: 6 }} />
                  )}
                  <Text style={styles.submitBtnText}>
                    {isFixed ? 'Criar Horário Fixo' : 'Confirmar Agendamento'}
                  </Text>
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
    fontSize: 16,
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
  segmentedRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    marginTop: 6,
  },
  segmentedBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  segmentedText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '800',
    textAlign: 'center',
  },
  paymentHint: {
    fontSize: theme.typography.sizes.caption,
    marginTop: 6,
  },
  fixedBox: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: theme.spacing.md,
  },
  fixedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fixedIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedTitle: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '800',
  },
  fixedDesc: {
    fontSize: theme.typography.sizes.caption,
    marginTop: 2,
    lineHeight: 15,
  },
  toggleTrack: {
    width: 50,
    height: 30,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.full,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
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
