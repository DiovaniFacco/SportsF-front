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
import { X, Calendar, Clock, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { createCourtBlock } from '../../api/courtBlocks';

export function CourtBlockModal({
  visible,
  onClose,
  courts = [],
  onSuccess,
  initialCourtId = null,
  initialStartTime = '12:00',
  initialEndTime = '14:00',
  initialDate = null,
}) {
  const { colors } = useTheme();

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [selectedCourtId, setSelectedCourtId] = useState(initialCourtId);
  const [date, setDate] = useState(initialDate || getTodayStr());
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [reason, setReason] = useState('Manutenção do Piso');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const reasonPresets = [
    '🌧️ Chuva / Mau Tempo',
    '🛠️ Manutenção do Piso',
    '💡 Manutenção da Iluminação',
    '🏆 Torneio / Evento Privado',
    '⛔ Quadra Indisponível',
  ];

  useEffect(() => {
    if (visible) {
      setSelectedCourtId(initialCourtId || (courts.length > 0 ? courts[0].id : null));
      setDate(initialDate || getTodayStr());
      setStartTime(initialStartTime || '12:00');
      setEndTime(initialEndTime || '14:00');
      setReason('Manutenção do Piso');
      setErrorMessage('');
    }
  }, [visible, courts, initialCourtId, initialStartTime, initialEndTime, initialDate]);

  const handleSubmit = async () => {
    if (!selectedCourtId) {
      setErrorMessage('Selecione uma quadra para realizar o bloqueio.');
      return;
    }
    if (!startTime || !endTime) {
      setErrorMessage('Informe os horários de início e término.');
      return;
    }
    if (!reason.trim()) {
      setErrorMessage('Por favor, informe o motivo do bloqueio.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const fullStartTime = `${date} ${startTime.length === 5 ? startTime + ':00' : startTime}`;
      const fullEndTime = `${date} ${endTime.length === 5 ? endTime + ':00' : endTime}`;

      await createCourtBlock({
        courtId: selectedCourtId,
        startTime: fullStartTime,
        endTime: fullEndTime,
        reason: reason.trim(),
      });

      const msg = 'Bloqueio de quadra registrado com sucesso!';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Sucesso', msg);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Erro ao bloquear quadra:', err);
      setErrorMessage('Não foi possível salvar o bloqueio da quadra.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Top Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ShieldAlert size={20} color={colors.error} style={{ marginRight: 8 }} />
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Bloquear Quadra / Manutenção</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  Impedir agendamentos por chuva, obras ou torneios
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            >
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {errorMessage ? (
              <View style={[styles.errorBox, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Seleção de Quadra */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Quadra *</Text>
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
                          backgroundColor: isSelected ? colors.error : colors.background,
                          borderColor: isSelected ? colors.error : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isSelected ? '#FFFFFF' : colors.text },
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
              <Text style={[styles.inputLabel, { color: colors.text }]}>Data (YYYY-MM-DD) *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Calendar size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={date}
                  onChangeText={setDate}
                  placeholder="Ex: 2026-08-20"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Horários */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Início do Bloqueio *</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Clock size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="12:00"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Fim do Bloqueio *</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Clock size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="14:00"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Motivo presets */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Motivo do Bloqueio *</Text>
              <View style={styles.presetWrap}>
                {reasonPresets.map((preset) => {
                  const isSelected = reason === preset;
                  return (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => setReason(preset)}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: isSelected ? colors.error + '20' : colors.background,
                          borderColor: isSelected ? colors.error : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.presetText, { color: isSelected ? colors.error : colors.text }]}>
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border, marginTop: 8 }]}>
                <AlertTriangle size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Ex: Reforma do piso de saibro"
                  placeholderTextColor={colors.textMuted}
                />
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
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSubmit}
              style={[styles.submitBtn, { backgroundColor: colors.error }]}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitBtnText}>Confirmar Bloqueio</Text>
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
    padding: theme.spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 550,
    maxHeight: '90%',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: theme.typography.sizes.caption,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    paddingHorizontal: theme.spacing.lg,
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
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    height: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.sizes.body2,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: theme.spacing.md,
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
  presetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
  },
});
