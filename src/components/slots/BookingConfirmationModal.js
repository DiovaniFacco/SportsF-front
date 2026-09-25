import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Banknote,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  FileText,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';

export function BookingConfirmationModal({
  visible,
  onClose,
  selectedSlots = [],
  selectedDate,
  court,
  venue,
  user,
  onConfirmBooking,
  isSubmitting = false,
  error = null,
  successBooking = null,
  onFinishSuccess,
}) {
  const { colors } = useTheme();
  const [notes, setNotes] = useState('');
  const scrollRef = useRef(null);

  // Erro sempre visível: ao falhar, rola até o banner de erro (telas pequenas
  // escondiam a mensagem no fim do conteúdo rolável).
  useEffect(() => {
    if (error && scrollRef.current?.scrollToEnd) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [error]);

  if (!visible) return null;

  const count = selectedSlots.length;
  const totalPrice = selectedSlots.reduce((acc, slot) => acc + (slot.price || 0), 0);

  // Data formatada DD/MM/YYYY
  const formattedDateParts = selectedDate ? selectedDate.split('-') : [];
  const dateFormatted =
    formattedDateParts.length === 3
      ? `${formattedDateParts[2]}/${formattedDateParts[1]}/${formattedDateParts[0]}`
      : selectedDate;

  const timesText = selectedSlots.map((s) => s.formatted_time).join(', ');

  const handleConfirm = () => {
    if (onConfirmBooking) {
      onConfirmBooking({
        notes,
      });
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={successBooking ? onFinishSuccess : onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.centeredContainer} pointerEvents="box-none">
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleRow}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {successBooking ? 'Agendamento Confirmado!' : 'Confirmar Agendamento'}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={successBooking ? onFinishSuccess : onClose}
              style={[styles.closeBtn, { backgroundColor: colors.backgroundSecondary }]}
            >
              <X size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* SUCCESS STATE */}
            {successBooking ? (
              <View style={styles.successContainer}>
                <View style={[styles.successIconBadge, { backgroundColor: colors.successSurface }]}>
                  <CheckCircle2 size={48} color={colors.success} />
                </View>

                <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
                  Horário Reservado com Sucesso!
                </Text>
                <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                  Seu horário foi agendado e bloqueado contra reservas simultâneas por outros usuários.
                </Text>

                {/* Summary Card */}
                <View style={[styles.summaryBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                  <View style={styles.summaryItem}>
                    <MapPin size={16} color={colors.primary} />
                    <Text style={[styles.summaryText, { color: colors.textPrimary }]}>
                      {court?.name} {venue?.name ? `(${venue.name})` : ''}
                    </Text>
                  </View>

                  <View style={styles.summaryItem}>
                    <Calendar size={16} color={colors.primary} />
                    <Text style={[styles.summaryText, { color: colors.textPrimary }]}>
                      {dateFormatted}
                    </Text>
                  </View>

                  <View style={styles.summaryItem}>
                    <Clock size={16} color={colors.primary} />
                    <Text style={[styles.summaryText, { color: colors.textPrimary }]}>
                      {timesText}
                    </Text>
                  </View>

                  <View style={styles.summaryItem}>
                    <Banknote size={16} color={colors.primary} />
                    <Text style={[styles.summaryText, { color: colors.textPrimary }]}>
                      Valor: R$ {Math.round(totalPrice)},00
                    </Text>
                  </View>
                </View>

                {/* Payment Badge Note */}
                <View style={[styles.paymentNotice, { backgroundColor: colors.infoSurface, borderColor: colors.info }]}>
                  <Banknote size={16} color={colors.info} />
                  <Text style={[styles.paymentNoticeText, { color: colors.textPrimary }]}>
                    <Text style={{ fontWeight: '700' }}>Pagamento no Local:</Text> O valor será pago diretamente no estabelecimento no momento da partida.
                  </Text>
                </View>
              </View>
            ) : (
              /* CONFIRMATION FORM STATE */
              <View style={styles.formContainer}>
                {/* Court and Venue Card */}
                <View style={[styles.venueCard, { backgroundColor: colors.backgroundSecondary }]}>
                  <Text style={[styles.courtName, { color: colors.textPrimary }]}>
                    {court?.name}
                  </Text>
                  {venue?.name ? (
                    <Text style={[styles.venueName, { color: colors.primary }]}>
                      {venue.name}
                    </Text>
                  ) : null}
                </View>

                {/* Details Breakdown Grid */}
                <View style={[styles.summaryBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconCol}>
                      <Calendar size={16} color={colors.primary} />
                    </View>
                    <View style={styles.detailTextCol}>
                      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Data</Text>
                      <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{dateFormatted}</Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.detailRow}>
                    <View style={styles.detailIconCol}>
                      <Clock size={16} color={colors.primary} />
                    </View>
                    <View style={styles.detailTextCol}>
                      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
                        {count === 1 ? 'Horário Selecionado' : `${count} Horários Selecionados`}
                      </Text>
                      <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{timesText}</Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.detailRow}>
                    <View style={styles.detailIconCol}>
                      <Banknote size={16} color={colors.primary} />
                    </View>
                    <View style={styles.detailTextCol}>
                      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Valor Total</Text>
                      <Text style={[styles.priceValue, { color: colors.primary }]}>
                        R$ {Math.round(totalPrice)},00
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Payment Notice Banner */}
                <View style={[styles.paymentNotice, { backgroundColor: colors.goldSurface || colors.warningSurface, borderColor: colors.gold || colors.warning }]}>
                  <Banknote size={18} color={colors.gold || colors.warning} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.paymentNoticeTitle, { color: colors.textPrimary }]}>
                      Pagamento Presencial / no Local
                    </Text>
                    <Text style={[styles.paymentNoticeSub, { color: colors.textSecondary }]}>
                      O agendamento não requer pagamento antecipado no aplicativo. O pagamento será feito diretamente no local.
                    </Text>
                  </View>
                </View>

                {/* User Info Section */}
                {user ? (
                  <View style={[styles.userSection, { backgroundColor: colors.backgroundSecondary }]}>
                    <UserCheck size={16} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.userSectionTitle, { color: colors.textPrimary }]}>
                        Agendando como: <Text style={{ fontWeight: '800' }}>{user.name}</Text>
                      </Text>
                      <Text style={[styles.userSectionSub, { color: colors.textMuted }]}>
                        {user.email}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {/* Notes Input */}
                <View style={styles.notesContainer}>
                  <View style={styles.notesLabelRow}>
                    <FileText size={14} color={colors.textMuted} />
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                      Observações ou Solicitações (opcional):
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.notesInput,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        color: colors.textPrimary,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder="Ex: Necessário coletes, bola..."
                    placeholderTextColor={colors.textDisabled}
                    multiline
                    numberOfLines={2}
                    value={notes}
                    onChangeText={setNotes}
                    editable={!isSubmitting}
                  />
                </View>

                {/* Error Banner */}
                {error ? (
                  <View style={[styles.errorBanner, { backgroundColor: colors.errorSurface, borderColor: colors.error }]}>
                    <AlertCircle size={20} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </ScrollView>

          {/* Footer Action Buttons */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            {successBooking ? (
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={onFinishSuccess}
                style={[styles.confirmBtn, { backgroundColor: colors.success }]}
              >
                <Text style={styles.confirmBtnText}>Concluir</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.footerBtnRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onClose}
                  disabled={isSubmitting}
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleConfirm}
                  disabled={isSubmitting}
                  style={[
                    styles.confirmBtn,
                    { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 },
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.confirmBtnText}>Confirmar Agendamento</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
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
  },
  centeredContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderWidth: 1,
    elevation: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  formContainer: {
    gap: 14,
  },
  venueCard: {
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  courtName: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: '800',
  },
  venueName: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '700',
    marginTop: 2,
  },
  summaryBox: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  detailIconCol: {
    width: 28,
    alignItems: 'center',
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  paymentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 10,
  },
  paymentNoticeTitle: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '800',
  },
  paymentNoticeSub: {
    fontSize: theme.typography.sizes.caption,
    marginTop: 2,
    lineHeight: 15,
  },
  paymentNoticeText: {
    flex: 1,
    fontSize: theme.typography.sizes.bodySmall,
    lineHeight: 16,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    gap: 10,
  },
  userSectionTitle: {
    fontSize: theme.typography.sizes.bodySmall,
  },
  userSectionSub: {
    fontSize: theme.typography.sizes.caption,
  },
  notesContainer: {
    gap: 6,
  },
  notesLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputLabel: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '600',
  },
  notesInput: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: 10,
    fontSize: theme.typography.sizes.label,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    gap: 12,
  },
  successIconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '800',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: theme.typography.sizes.label,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: theme.spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  summaryText: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '600',
  },
  modalFooter: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
  },
  footerBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: theme.typography.sizes.button,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.button,
    fontWeight: '700',
  },
});
