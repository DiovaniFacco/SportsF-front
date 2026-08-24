import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Clock, Plus, Trash2, ShieldAlert, CheckCircle2, Calendar } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { getCourtOperatingHours, saveCourtOperatingHour, deleteCourtOperatingHour } from '../../api/operatingHours';

const DAYS_OF_WEEK = [
  { id: 0, label: 'Domingo', short: 'Dom' },
  { id: 1, label: 'Segunda-feira', short: 'Seg' },
  { id: 2, label: 'Terça-feira', short: 'Ter' },
  { id: 3, label: 'Quarta-feira', short: 'Qua' },
  { id: 4, label: 'Quinta-feira', short: 'Qui' },
  { id: 5, label: 'Sexta-feira', short: 'Sex' },
  { id: 6, label: 'Sábado', short: 'Sáb' },
];

export function CourtOperatingHoursModal({ visible, court, onClose, onSuccess }) {
  const { colors } = useTheme();

  const [selectedDay, setSelectedDay] = useState(1); // Segunda por padrão
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('12:00');
  const [slotDuration, setSlotDuration] = useState('60');

  const [operatingHoursList, setOperatingHoursList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchHours = useCallback(async () => {
    if (!court?.id) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await getCourtOperatingHours(court.id);
      setOperatingHoursList(data);
    } catch (err) {
      console.warn('Erro ao carregar horários de funcionamento:', err);
      setOperatingHoursList([]);
    } finally {
      setLoading(false);
    }
  }, [court?.id]);

  useEffect(() => {
    if (visible && court) {
      fetchHours();
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [visible, court, fetchHours]);

  // Turnos filtrados para o dia selecionado
  const currentDayShifts = operatingHoursList.filter((h) => Number(h.day_of_week) === selectedDay);

  const handleAddShift = async () => {
    if (!court?.id) return;

    if (!startTime.trim() || !endTime.trim()) {
      setErrorMsg('Informe o horário de início e fim do turno.');
      return;
    }

    const durationNum = parseInt(slotDuration, 10);
    if (isNaN(durationNum) || durationNum < 15 || durationNum > 240) {
      setErrorMsg('Duração do slot deve ser entre 15 e 240 minutos.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        day_of_week: selectedDay,
        start_time: startTime.trim(),
        end_time: endTime.trim(),
        slot_duration_minutes: durationNum,
      };

      await saveCourtOperatingHour(court.id, payload);
      setSuccessMsg(`Turno das ${startTime.trim()} às ${endTime.trim()} adicionado com sucesso!`);
      
      // Limpar campos ou sugerir próximo turno (ex: tarde/noite)
      if (startTime.trim() === '08:00' && endTime.trim() === '12:00') {
        setStartTime('17:00');
        setEndTime('22:00');
      }

      await fetchHours();
      onSuccess && onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao adicionar turno de funcionamento.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShift = async (shiftId) => {
    setDeletingId(shiftId);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await deleteCourtOperatingHour(shiftId);
      setSuccessMsg('Turno removido com sucesso!');
      await fetchHours();
      onSuccess && onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao remover turno.';
      setErrorMsg(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.titleRow}>
              <View style={[styles.iconBadge, { backgroundColor: colors.primary + '18' }]}>
                <Clock size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Turnos de Funcionamento</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  {court?.name || 'Quadra'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Form Body */}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {errorMsg ? (
              <View style={[styles.alertBox, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
                <ShieldAlert size={18} color={colors.error} />
                <Text style={[styles.alertText, { color: colors.error }]}>{errorMsg}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={[styles.alertBox, { backgroundColor: colors.success + '15', borderColor: colors.success + '40' }]}>
                <CheckCircle2 size={18} color={colors.success} />
                <Text style={[styles.alertText, { color: colors.success }]}>{successMsg}</Text>
              </View>
            ) : null}

            {/* Seletor de Dias da Semana */}
            <Text style={[styles.label, { color: colors.text }]}>Selecione o Dia da Semana</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
              <View style={styles.daysContainer}>
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = selectedDay === day.id;
                  const dayShiftsCount = operatingHoursList.filter((h) => Number(h.day_of_week) === day.id).length;
                  return (
                    <TouchableOpacity
                      key={day.id}
                      activeOpacity={0.7}
                      onPress={() => setSelectedDay(day.id)}
                      style={[
                        styles.dayChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : dayShiftsCount > 0
                            ? colors.primary + '15'
                            : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : dayShiftsCount > 0
                              ? colors.primary
                              : colors.textMuted,
                          },
                        ]}
                      >
                        {day.short}
                      </Text>
                      {dayShiftsCount > 0 ? (
                        <View
                          style={[
                            styles.badgeCount,
                            {
                              backgroundColor: isSelected ? '#FFFFFF' : colors.primary,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeCountText,
                              { color: isSelected ? colors.primary : '#FFFFFF' },
                            ]}
                          >
                            {dayShiftsCount}
                          </Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Turnos Existentes do Dia Selecionado */}
            <View style={[styles.sectionBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Turnos de {DAYS_OF_WEEK.find((d) => d.id === selectedDay)?.label}
              </Text>

              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
              ) : currentDayShifts.length === 0 ? (
                <View style={styles.emptyShiftsBox}>
                  <Text style={[styles.emptyShiftsText, { color: colors.textMuted }]}>
                    Nenhum turno cadastrado para este dia. Adicione um turno abaixo para definir o horário de funcionamento.
                  </Text>
                </View>
              ) : (
                <View style={styles.shiftsList}>
                  {currentDayShifts.map((shift) => (
                    <View
                      key={shift.id}
                      style={[styles.shiftCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      <View style={styles.shiftInfo}>
                        <Clock size={16} color={colors.primary} />
                        <Text style={[styles.shiftTimeText, { color: colors.text }]}>
                          {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}
                        </Text>
                        <View style={[styles.slotBadge, { backgroundColor: colors.primary + '15' }]}>
                          <Text style={[styles.slotBadgeText, { color: colors.primary }]}>
                            {shift.slot_duration_minutes} min/slot
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleDeleteShift(shift.id)}
                        disabled={deletingId === shift.id}
                        style={[styles.btnDeleteShift, { backgroundColor: colors.error + '15' }]}
                      >
                        {deletingId === shift.id ? (
                          <ActivityIndicator size="small" color={colors.error} />
                        ) : (
                          <Trash2 size={16} color={colors.error} />
                        )}
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Form de Adição de Novo Turno */}
              <View style={[styles.addFormContainer, { borderTopColor: colors.border }]}>
                <Text style={[styles.addFormTitle, { color: colors.text }]}>
                  + Adicionar Turno (Manhã, Tarde ou Noite)
                </Text>

                <View style={styles.rowInputs}>
                  {/* Abertura */}
                  <View style={styles.inputFlex}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Início do Turno</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      placeholder="08:00"
                      placeholderTextColor={colors.textMuted}
                      value={startTime}
                      onChangeText={setStartTime}
                    />
                  </View>

                  {/* Fechamento */}
                  <View style={styles.inputFlex}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Fim do Turno</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      placeholder="12:00"
                      placeholderTextColor={colors.textMuted}
                      value={endTime}
                      onChangeText={setEndTime}
                    />
                  </View>
                </View>

                {/* Duração do Slot */}
                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Duração do Slot (minutos)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="60"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={slotDuration}
                    onChangeText={setSlotDuration}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleAddShift}
                  disabled={submitting}
                  style={[styles.btnAddShift, { backgroundColor: colors.primary }]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.btnAddShiftText}>Adicionar Este Turno</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Resumo da Semana */}
            <View style={{ marginTop: theme.spacing.md }}>
              <View style={styles.summaryHeader}>
                <Calendar size={16} color={colors.primary} />
                <Text style={[styles.summaryTitle, { color: colors.text }]}>Resumo Semanal dos Turnos</Text>
              </View>

              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 14 }} />
              ) : operatingHoursList.length === 0 ? (
                <Text style={[styles.emptySummaryText, { color: colors.textMuted }]}>
                  Nenhum turno cadastrado ainda. A quadra usará a grade padrão até que turnos sejam definidos.
                </Text>
              ) : (
                <View style={styles.summaryGrid}>
                  {DAYS_OF_WEEK.map((d) => {
                    const shifts = operatingHoursList.filter((h) => Number(h.day_of_week) === d.id);
                    return (
                      <View
                        key={d.id}
                        style={[
                          styles.summaryItem,
                          {
                            backgroundColor: shifts.length > 0 ? colors.primary + '10' : colors.background,
                            borderColor: shifts.length > 0 ? colors.primary + '30' : colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.summaryDayName, { color: colors.text }]}>{d.short}</Text>
                        <Text style={[styles.summaryDayHours, { color: shifts.length > 0 ? colors.primary : colors.textMuted }]}>
                          {shifts.length > 0
                            ? shifts.map((s) => `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}`).join('  |  ')
                            : 'Sem turnos / Fechado'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={[styles.btnClose, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={onClose}>
              <Text style={[styles.btnCloseText, { color: colors.text }]}>Concluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs || 8,
    paddingVertical: theme.spacing.sm,
  },
  modalContainer: {
    width: '96%',
    maxWidth: 560,
    maxHeight: '92%',
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: theme.typography.sizes.caption,
  },
  closeButton: {
    padding: 6,
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  alertText: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '600',
    flex: 1,
  },
  label: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
    marginBottom: 8,
  },
  daysScroll: {
    marginBottom: theme.spacing.md,
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dayChipText: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
  },
  badgeCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  sectionBox: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.body1,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  emptyShiftsBox: {
    paddingVertical: 10,
  },
  emptyShiftsText: {
    fontSize: theme.typography.sizes.caption,
    fontStyle: 'italic',
  },
  shiftsList: {
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  shiftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shiftTimeText: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
  },
  slotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  slotBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  btnDeleteShift: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFormContainer: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
  },
  addFormTitle: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  inputFlex: {
    flex: 1,
  },
  inputLabel: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.sizes.body2,
  },
  btnAddShift: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.md,
  },
  btnAddShiftText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
  },
  emptySummaryText: {
    fontSize: theme.typography.sizes.caption,
    fontStyle: 'italic',
  },
  summaryGrid: {
    gap: 6,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  summaryDayName: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '600',
  },
  summaryDayHours: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
  },
  modalFooter: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  btnClose: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  btnCloseText: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
  },
});
