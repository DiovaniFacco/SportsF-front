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
import { X, Calendar, Clock, User, Phone, FileText, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { createBooking } from '../../api/bookings';

export function ManualBookingModal({
  visible,
  onClose,
  courts = [],
  onSuccess,
  initialCourtId = null,
  initialStartTime = '18:00',
  initialEndTime = '19:00',
  initialDate = null,
}) {
  const { colors, isDark } = useTheme();

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [selectedCourtId, setSelectedCourtId] = useState(initialCourtId);
  const [date, setDate] = useState(initialDate || getTodayStr());
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (visible) {
      setSelectedCourtId(initialCourtId || (courts.length > 0 ? courts[0].id : null));
      setDate(initialDate || getTodayStr());
      setStartTime(initialStartTime || '18:00');
      setEndTime(initialEndTime || '19:00');
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
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
    if (!customerPhone.trim()) {
      setErrorMessage('Por favor, informe o telefone do cliente.');
      return;
    }
    if (!startTime || !endTime) {
      setErrorMessage('Informe o horário de início e término.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const fullStartTime = `${date} ${startTime.length === 5 ? startTime + ':00' : startTime}`;
      const fullEndTime = `${date} ${endTime.length === 5 ? endTime + ':00' : endTime}`;

      await createBooking({
        courtId: selectedCourtId,
        startTime: fullStartTime,
        endTime: fullEndTime,
        isManual: true,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        notes: notes.trim() || 'Agendamento presencial / balcão',
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
      const apiMsg = err.response?.data?.message || 'Não foi possível salvar o agendamento. Verifique os dados.';
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>Novo Agendamento Balcão</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                Reserva presencial ou via WhatsApp
              </Text>
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
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
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

            {/* Horário Início e Término */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Início *</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Clock size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="18:00"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Término *</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Clock size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="19:00"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Atalhos Rápidos de Horário */}
            <Text style={[styles.quickLabel, { color: colors.textMuted }]}>Horários Frequentes:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickTimeScroll}>
              {['08:00', '09:00', '10:00', '14:00', '18:00', '19:00', '20:00', '21:00'].map((time) => (
                <TouchableOpacity
                  key={time}
                  onPress={() => {
                    setStartTime(time);
                    const hour = parseInt(time.split(':')[0], 10) + 1;
                    setEndTime(`${String(hour).padStart(2, '0')}:00`);
                  }}
                  style={[styles.quickTimeBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <Text style={[styles.quickTimeText, { color: colors.text }]}>{time}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Dados do Cliente */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Nome do Cliente *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <User size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Ex: João da Silva (Balcão)"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Telefone / WhatsApp *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Phone size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
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
              <Text style={[styles.inputLabel, { color: colors.text }]}>Observações</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border, height: 70, alignItems: 'flex-start', paddingTop: 10 }]}>
                <FileText size={18} color={colors.textMuted} style={{ marginRight: 10, marginTop: 2 }} />
                <TextInput
                  style={[styles.input, { color: colors.text, textAlignVertical: 'top' }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Ex: Pago em dinheiro / Equipamento alugado"
                  multiline
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
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
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
  quickLabel: {
    fontSize: 11,
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
    fontSize: 12,
    fontWeight: '600',
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
