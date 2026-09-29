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
import { X, Repeat, CheckCircle2, User, Phone } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import {
  createFixedSchedule,
  updateFixedSchedule,
  weekdayLabel,
  formatDateBR,
  extractApiError,
} from '../../api/fixedSchedules';
import { getTodayStrInSaoPaulo } from '../../utils/datetime';
import { DatePickerInput } from '../common/DatePickerInput';
import { TimePickerInput } from '../common/TimePickerInput';

/**
 * Modal de criação/edição de horário fixo semanal.
 * Ex: toda segunda 19:00-20:00 do "Time do João", sem data final.
 */
export function FixedScheduleModal({
  visible,
  onClose,
  courts = [],
  fixedSchedule = null, // edição quando presente
  initialCourtId = null,
  onSuccess,
}) {
  const { colors } = useTheme();
  const isEditing = Boolean(fixedSchedule?.id);

  const [selectedCourtId, setSelectedCourtId] = useState(initialCourtId);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:00');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [validFrom, setValidFrom] = useState(getTodayStrInSaoPaulo());
  const [hasEnd, setHasEnd] = useState(false);
  const [validUntil, setValidUntil] = useState(getTodayStrInSaoPaulo());
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (fixedSchedule?.id) {
      setSelectedCourtId(fixedSchedule.court_id);
      setDayOfWeek(Number(fixedSchedule.day_of_week ?? 1));
      setStartTime(String(fixedSchedule.start_time || '19:00').substring(0, 5));
      setEndTime(String(fixedSchedule.end_time || '20:00').substring(0, 5));
      setCustomerName(fixedSchedule.customer_name || '');
      setCustomerPhone(fixedSchedule.customer_phone || '');
      setValidFrom(String(fixedSchedule.valid_from || getTodayStrInSaoPaulo()).substring(0, 10));
      setHasEnd(Boolean(fixedSchedule.valid_until));
      setValidUntil(String(fixedSchedule.valid_until || getTodayStrInSaoPaulo()).substring(0, 10));
      setNotes(fixedSchedule.notes || '');
    } else {
      setSelectedCourtId(initialCourtId || fixedSchedule?.court_id || (courts.length > 0 ? courts[0].id : null));
      setDayOfWeek(1);
      setStartTime('19:00');
      setEndTime('20:00');
      setCustomerName('');
      setCustomerPhone('');
      setValidFrom(getTodayStrInSaoPaulo());
      setHasEnd(false);
      setValidUntil(getTodayStrInSaoPaulo());
      setNotes('');
    }
    setErrorMessage('');
  }, [visible]);

  const handleSubmit = async () => {
    if (!selectedCourtId) {
      setErrorMessage('Selecione uma quadra.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMessage('Informe o nome do cliente/time (ex: Time do João).');
      return;
    }
    if (!startTime || !endTime) {
      setErrorMessage('Informe início e término.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      if (isEditing) {
        await updateFixedSchedule(fixedSchedule.id, {
          day_of_week: Number(dayOfWeek),
          start_time: startTime,
          end_time: endTime,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim() || null,
          valid_from: validFrom,
          valid_until: hasEnd ? validUntil : null,
          notes: notes.trim() || null,
        });
      } else {
        await createFixedSchedule({
          courtId: selectedCourtId,
          dayOfWeek: Number(dayOfWeek),
          startTime,
          endTime,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || null,
          validFrom,
          validUntil: hasEnd ? validUntil : null,
          notes: notes.trim() || null,
        });
      }

      const msg = isEditing
        ? 'Horário fixo atualizado!'
        : `Horário fixo criado: toda ${weekdayLabel(dayOfWeek, true)} ${startTime} às ${endTime}.`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Sucesso', msg);

      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMessage(extractApiError(err, 'Não foi possível salvar o horário fixo.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  const summary = `Toda ${weekdayLabel(dayOfWeek, true)} • ${startTime} às ${endTime} • de ${formatDateBR(validFrom)}${hasEnd ? ` até ${formatDateBR(validUntil)}` : ' • sem data final'}`;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Repeat size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {isEditing ? 'Editar Horário Fixo' : 'Novo Horário Fixo'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  Repete toda semana até você excluir
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

            <View style={[styles.summaryBox, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
              <Repeat size={14} color={colors.primary} />
              <Text style={[styles.summaryText, { color: colors.primary }]}>{summary}</Text>
            </View>

            {!isEditing ? (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Quadra *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {courts.map((court) => {
                    const isSelected = String(selectedCourtId) === String(court.id);
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
                        <Text style={[styles.chipText, { color: isSelected ? colors.white : colors.textPrimary }]}>
                          {court.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Dia da semana *</Text>
              <View style={styles.weekWrap}>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                  const isSelected = Number(dayOfWeek) === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      activeOpacity={0.7}
                      onPress={() => setDayOfWeek(d)}
                      style={[
                        styles.weekChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: isSelected ? colors.white : colors.textPrimary }]}>
                        {weekdayLabel(d)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Início *</Text>
                <TimePickerInput value={startTime} onChangeTime={setStartTime} colors={colors} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Término *</Text>
                <TimePickerInput value={endTime} onChangeTime={setEndTime} colors={colors} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Cliente / Time *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <User size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Ex: Time do João / Aula da Maria"
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
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Vale a partir de *</Text>
                <DatePickerInput value={validFrom} onChangeDate={setValidFrom} colors={colors} />
              </View>
              {hasEnd ? (
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Vale até</Text>
                  <DatePickerInput value={validUntil} onChangeDate={setValidUntil} colors={colors} minDate={validFrom} />
                </View>
              ) : null}
            </View>

            <View
              style={[
                styles.endBox,
                {
                  backgroundColor: !hasEnd ? colors.primaryLight : colors.background,
                  borderColor: !hasEnd ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.endTitle, { color: colors.textPrimary }]}>Sem data final</Text>
                <Text style={[styles.endDesc, { color: colors.textSecondary }]}>
                  O horário repete para sempre, até você excluir a série.
                </Text>
              </View>
              {/* Toggle customizado com a cor do tema: o Switch nativo usa o
                  verde padrão do sistema no web/iOS e ignora o trackColor. */}
              <TouchableOpacity
                activeOpacity={0.8}
                accessibilityRole="switch"
                accessibilityState={{ checked: !hasEnd }}
                onPress={() => setHasEnd((prev) => !prev)}
                style={[
                  styles.toggleTrack,
                  {
                    backgroundColor: !hasEnd ? colors.primary : colors.border,
                    borderColor: !hasEnd ? colors.primary : colors.borderStrong,
                  },
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    {
                      backgroundColor: colors.white,
                      alignSelf: !hasEnd ? 'flex-end' : 'flex-start',
                    },
                  ]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Observação (opcional)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Ex: mensalista, aula de vôlei"
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
                  <Text style={styles.submitBtnText}>{isEditing ? 'Salvar' : 'Criar Horário Fixo'}</Text>
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
  summaryBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: theme.radius.md,
    padding: theme.spacing.sm, marginBottom: theme.spacing.md,
  },
  summaryText: { flex: 1, fontSize: theme.typography.sizes.bodySmall, fontWeight: '700' },
  inputGroup: { marginBottom: theme.spacing.md },
  inputLabel: { fontSize: theme.typography.sizes.body, fontWeight: '700', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: theme.spacing.md, height: 44,
    borderRadius: theme.radius.md, borderWidth: 1,
  },
  input: { flex: 1, fontSize: theme.typography.sizes.body },
  rowInputs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipScroll: { flexDirection: 'row', marginTop: 4 },
  chipBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: theme.radius.full, borderWidth: 1, marginRight: 8,
  },
  chipText: { fontSize: theme.typography.sizes.caption, fontWeight: '700' },
  weekWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  weekChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: theme.radius.md, borderWidth: 1, minWidth: 52, alignItems: 'center',
  },
  endBox: {
    borderWidth: 1, borderRadius: theme.radius.md,
    padding: 12, marginBottom: theme.spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  endTitle: { fontSize: theme.typography.sizes.label, fontWeight: '800' },
  endDesc: { fontSize: theme.typography.sizes.caption, marginTop: 2, lineHeight: 15 },
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
