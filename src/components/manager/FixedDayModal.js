import React, { useState, useEffect, useMemo } from 'react';
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
import {
  X,
  Repeat,
  CheckCircle2,
  CalendarOff,
  CalendarCheck,
  Banknote,
  Trash2,
  Edit3,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import {
  launchFixedScheduleDay,
  skipFixedScheduleDate,
  unskipFixedScheduleDate,
  deleteFixedSchedule,
  weekdayLabel,
  formatTime,
  formatDateBR,
  extractApiError,
} from '../../api/fixedSchedules';
import { getUserBookings, cancelBooking, updateBookingPayment } from '../../api/bookings';
import {
  formatBRL,
  parseBRLInput,
  getPaymentStatus,
  getPaidAmount,
  getTotalPrice,
  getRemainingAmount,
  PAYMENT_PAGO,
  PAYMENT_PENDENTE,
  PAYMENT_LABELS,
} from '../../utils/payment';

function toMinutes(t) {
  const m = String(t || '').match(/^(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

function timeOf(dateTimeStr) {
  const s = String(dateTimeStr || '');
  if (s.includes('T')) return (s.split('T')[1] || '').substring(0, 5);
  if (s.includes(' ')) return (s.split(' ')[1] || '').substring(0, 5);
  return s.substring(0, 5);
}

function bookingFixedId(b) {
  return b?.court_fixed_schedule_id ?? b?.fixed_schedule_id ?? b?.fixedSchedule?.id ?? null;
}

/**
 * Modal ÚNICO de gerenciamento de um dia do horário fixo.
 *
 * Substitui o fluxo antigo em 3 lugares (prompt "1=Lançar 2=Desmarcar",
 * FixedOccurrenceLaunchModal, date-picker "Desmarcar dia"):
 *
 * - Lançar o dia como agendamento normal (com pago/pendente/não pago),
 *   que entra em Agendamentos, Faturamento e Métricas;
 * - Editar o pagamento do dia já lançado / cancelar o lançamento;
 * - Desmarcar SÓ este dia (a série continua) ou reativar;
 * - Editar / excluir a série toda.
 */
export function FixedDayModal({
  visible,
  fixed = null,
  date = null, // 'YYYY-MM-DD'
  courts = [],
  initialBooking = null,
  initialSkipped = false,
  initialException = null,
  onClose,
  onChanged,
  onOpenEdit,
}) {
  const { colors } = useTheme();

  const [loadingDay, setLoadingDay] = useState(false);
  const [dayBooking, setDayBooking] = useState(null);
  const [skipped, setSkipped] = useState(false);
  const [exception, setException] = useState(null);

  const [paidInput, setPaidInput] = useState('0');
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const dayStr = String(date || '').substring(0, 10);

  const court = useMemo(
    () => (courts || []).find((c) => String(c?.id) === String(fixed?.court_id)),
    [courts, fixed],
  );
  const rate = court?.hourly_rate != null ? Number(court.hourly_rate) : null;
  const hours = useMemo(() => {
    const s = toMinutes(fixed?.start_time);
    const e = toMinutes(fixed?.end_time);
    return s != null && e != null && e > s ? (e - s) / 60 : 1;
  }, [fixed]);
  const expected = rate != null && Number.isFinite(rate) ? Math.round(rate * hours * 100) / 100 : null;

  const paymentPreview = useMemo(() => {
    const paid = parseBRLInput(paidInput);
    if (!Number.isFinite(paid) || paid <= 0) return { label: PAYMENT_LABELS.nao_pago, colorKey: 'error' };
    if (expected != null && paid >= expected) return { label: PAYMENT_LABELS.pago, colorKey: 'success' };
    return { label: PAYMENT_LABELS.pendente, colorKey: 'gold' };
  }, [paidInput, expected]);

  // Carrega o estado real do dia ao abrir: já lançado? desmarcado?
  useEffect(() => {
    if (!visible || !fixed?.id || !dayStr) return;
    let cancelled = false;
    setErrorMessage('');
    setInfoMessage('');
    setReason('');
    setDayBooking(initialBooking || null);
    setPaidInput(
      initialBooking ? String(getPaidAmount(initialBooking) ?? 0) : expected != null ? String(expected) : '0',
    );
    const exFromProp = initialException
      || (Array.isArray(fixed.exceptions) ? fixed.exceptions : []).find(
        (e) => String(e?.date).substring(0, 10) === dayStr,
      )
      || null;
    setException(exFromProp);
    setSkipped(Boolean(initialSkipped || exFromProp));

    setLoadingDay(true);
    (async () => {
      try {
        const res = await getUserBookings({ date: dayStr });
        const list = res?.data || (Array.isArray(res) ? res : []);
        const found = (Array.isArray(list) ? list : []).find((b) => {
          if (!b || b.status === 'cancelled') return false;
          if (String(b.court_id) !== String(fixed.court_id)) return false;
          const linked = bookingFixedId(b);
          if (linked != null && String(linked) === String(fixed.id)) return true;
          // Fallback: mesmo horário do fixo (lançamento sem vínculo explícito)
          return timeOf(b.start_time) === formatTime(fixed.start_time);
        });
        if (!cancelled && found) {
          setDayBooking(found);
          setPaidInput(String(getPaidAmount(found) ?? 0));
        }
      } catch {
        // Mantém o estado inicial; o gestor ainda consegue lançar/desmarcar.
      } finally {
        if (!cancelled) setLoadingDay(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, fixed?.id, dayStr]);

  if (!visible) return null;

  const fail = (err, fallback) => {
    const msg = extractApiError(err, fallback);
    setErrorMessage(msg);
  };

  const handleLaunch = async () => {
    const paid = parseBRLInput(paidInput);
    if (!Number.isFinite(paid)) {
      setErrorMessage('Informe um valor válido (ex: 0, 40 ou 80).');
      return;
    }
    setActing('launch');
    setErrorMessage('');
    try {
      await launchFixedScheduleDay(fixed.id, {
        courtId: fixed.court_id,
        date: dayStr,
        startTime: formatTime(fixed.start_time),
        endTime: formatTime(fixed.end_time),
        customerName: fixed.customer_name,
        customerPhone: fixed.customer_phone || null,
        paidAmount: paid,
        notes: `Dia ${formatDateBR(dayStr)} do horário fixo`,
      });
      setInfoMessage(
        paid >= (expected ?? paid) && paid > 0
          ? `Dia ${formatDateBR(dayStr)} lançado como PAGO. Entrou em Agendamentos e Faturamento.`
          : `Dia ${formatDateBR(dayStr)} lançado. Entrou em Agendamentos e Faturamento.`,
      );
      // Recarrega o lançamento para exibir o estado "lançado"
      try {
        const res = await getUserBookings({ date: dayStr });
        const list = res?.data || (Array.isArray(res) ? res : []);
        const found = (Array.isArray(list) ? list : []).find((b) => {
          if (!b || b.status === 'cancelled') return false;
          if (String(b.court_id) !== String(fixed.court_id)) return false;
          const linked = bookingFixedId(b);
          return linked != null && String(linked) === String(fixed.id);
        });
        if (found) {
          setDayBooking(found);
          setPaidInput(String(getPaidAmount(found) ?? 0));
        }
      } catch { /* estado local já reflete o lançamento */ }
      onChanged?.();
    } catch (err) {
      fail(err, 'Não foi possível lançar o dia.');
    } finally {
      setActing(null);
    }
  };

  const handleSavePayment = async () => {
    if (!dayBooking?.id) return;
    const paid = parseBRLInput(paidInput);
    if (!Number.isFinite(paid)) {
      setErrorMessage('Informe um valor válido (ex: 0, 40 ou 80).');
      return;
    }
    setActing('pay');
    setErrorMessage('');
    try {
      const res = await updateBookingPayment(dayBooking.id, paid);
      const updated = res?.booking || res;
      setDayBooking((prev) => ({ ...prev, ...updated, paid_amount: paid }));
      setInfoMessage(`Pagamento do dia atualizado para ${formatBRL(paid)}.`);
      onChanged?.();
    } catch (err) {
      fail(err, 'Não foi possível atualizar o pagamento.');
    } finally {
      setActing(null);
    }
  };

  const handleCancelLaunch = async () => {
    if (!dayBooking?.id) return;
    const ok = Platform.OS === 'web'
      ? window.confirm(`Cancelar o lançamento do dia ${formatDateBR(dayStr)}? A série fixa continua valendo.`)
      : true;
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Cancelar lançamento',
        `Cancelar o agendamento do dia ${formatDateBR(dayStr)}? A série fixa continua valendo nos demais dias.`,
        [
          { text: 'Manter', style: 'cancel' },
          {
            text: 'Cancelar dia',
            style: 'destructive',
            onPress: async () => {
              setActing('cancel-launch');
              try {
                await cancelBooking(dayBooking.id);
                setDayBooking(null);
                setPaidInput(expected != null ? String(expected) : '0');
                setInfoMessage('Lançamento cancelado. A série continua nos demais dias.');
                onChanged?.();
              } catch (err) {
                fail(err, 'Não foi possível cancelar o lançamento.');
              } finally {
                setActing(null);
              }
            },
          },
        ],
      );
      return;
    }
    if (!ok) return;
    setActing('cancel-launch');
    try {
      await cancelBooking(dayBooking.id);
      setDayBooking(null);
      setPaidInput(expected != null ? String(expected) : '0');
      setInfoMessage('Lançamento cancelado. A série continua nos demais dias.');
      onChanged?.();
    } catch (err) {
      fail(err, 'Não foi possível cancelar o lançamento.');
    } finally {
      setActing(null);
    }
  };

  const handleSkip = async () => {
    setActing('skip');
    setErrorMessage('');
    try {
      const res = await skipFixedScheduleDate(fixed.id, dayStr, reason.trim() || null);
      setSkipped(true);
      setException(res || { date: dayStr, reason: reason.trim() || null });
      setInfoMessage(`Dia ${formatDateBR(dayStr)} desmarcado. A série continua nos demais dias.`);
      onChanged?.();
    } catch (err) {
      fail(err, 'Não foi possível desmarcar este dia.');
    } finally {
      setActing(null);
    }
  };

  const handleUnskip = async () => {
    if (!exception?.id) {
      // Sem id da exceção: tenta reativar buscando a exceção atual
      setErrorMessage('Não foi possível identificar a desmarcação. Feche e abra o dia novamente.');
      return;
    }
    setActing('unskip');
    setErrorMessage('');
    try {
      await unskipFixedScheduleDate(fixed.id, exception.id);
      setSkipped(false);
      setException(null);
      setInfoMessage(`Dia ${formatDateBR(dayStr)} reativado na série.`);
      onChanged?.();
    } catch (err) {
      fail(err, 'Não foi possível reativar este dia.');
    } finally {
      setActing(null);
    }
  };

  const handleDeleteSeries = () => {
    const msg = `Excluir a série "${fixed?.customer_name}" (toda ${weekdayLabel(fixed?.day_of_week, true)} ${formatTime(fixed?.start_time)} às ${formatTime(fixed?.end_time)})? Todas as ocorrências futuras serão liberadas.`;
    const doDelete = async () => {
      setActing('del');
      try {
        await deleteFixedSchedule(fixed.id);
        onChanged?.();
        onClose();
      } catch (err) {
        fail(err, 'Não foi possível excluir a série.');
      } finally {
        setActing(null);
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) doDelete();
    } else {
      Alert.alert('Excluir série fixa', msg, [
        { text: 'Manter', style: 'cancel' },
        { text: 'Excluir série', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const previewColor = paymentPreview.colorKey === 'success'
    ? colors.success
    : paymentPreview.colorKey === 'gold'
      ? (colors.gold ?? '#B45309')
      : colors.error;

  const launchedStatus = dayBooking ? getPaymentStatus(dayBooking) : null;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Repeat size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {fixed?.customer_name || 'Horário fixo'} • {formatDateBR(dayStr)}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  Toda {weekdayLabel(fixed?.day_of_week, true)} • {formatTime(fixed?.start_time)} às {formatTime(fixed?.end_time)}
                  {court ? ` • ${court.name}` : ''}
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
            {infoMessage ? (
              <View style={[styles.infoBox, { backgroundColor: colors.successSurface, borderColor: colors.success }]}>
                <CheckCircle2 size={14} color={colors.success} style={{ marginRight: 6 }} />
                <Text style={[styles.infoText, { color: colors.success }]}>{infoMessage}</Text>
              </View>
            ) : null}

            {loadingDay ? (
              <View style={styles.centerRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.hint, { color: colors.textMuted, marginLeft: 8 }]}>
                  Verificando situação do dia...
                </Text>
              </View>
            ) : null}

            {/* Estado atual do dia */}
            <View style={[styles.statusBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Situação deste dia</Text>
              {dayBooking ? (
                <View style={[styles.launchedBox, { backgroundColor: colors.successSurface, borderColor: colors.success }]}>
                  <CheckCircle2 size={16} color={colors.success} style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.launchedTitle, { color: colors.success }]}>
                      Lançado como agendamento • {launchedStatus === PAYMENT_PAGO ? 'PAGO' : launchedStatus === PAYMENT_PENDENTE ? 'PENDENTE' : 'NÃO PAGO'}
                    </Text>
                    <Text style={[styles.launchedSub, { color: colors.textSecondary }]}>
                      Total {formatBRL(getTotalPrice(dayBooking))} • Recebido {formatBRL(getPaidAmount(dayBooking))} • Falta {formatBRL(getRemainingAmount(dayBooking))}
                    </Text>
                  </View>
                </View>
              ) : skipped ? (
                <View style={[styles.launchedBox, { backgroundColor: colors.backgroundSecondary ?? colors.background, borderColor: colors.border }]}>
                  <CalendarOff size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.launchedTitle, { color: colors.textSecondary }]}>Desmarcado só neste dia</Text>
                    <Text style={[styles.launchedSub, { color: colors.textMuted }]}>
                      {exception?.reason ? `Motivo: ${exception.reason}` : 'A série continua nos demais dias.'}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.launchedBox, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                  <Banknote size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.launchedTitle, { color: colors.primary }]}>A lançar — ainda não virou agendamento</Text>
                    <Text style={[styles.launchedSub, { color: colors.textSecondary }]}>
                      Confirme abaixo com o valor recebido. O dia entra em Agendamentos, Faturamento e Métricas.
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Pagamento do dia (lançar ou editar) */}
            {!skipped ? (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                  {dayBooking ? 'Valor recebido neste dia (R$) — editar' : 'Valor recebido neste dia (R$) *'}
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
                    editable={acting == null}
                  />
                </View>
                <Text style={[styles.paymentHint, { color: colors.textMuted }]}>
                  {expected != null ? `Valor do horário: ${formatBRL(expected)}. ` : ''}
                  Vai ficar como <Text style={{ fontWeight: '800', color: previewColor }}>{paymentPreview.label}</Text>.
                </Text>
                <View style={styles.paymentRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setPaidInput('0')}
                    disabled={acting != null}
                    style={[styles.paymentBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                  >
                    <Text style={[styles.paymentBtnText, { color: colors.textSecondary }]}>Não pago</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { if (expected != null) setPaidInput(String(expected)); }}
                    disabled={acting != null}
                    style={[styles.paymentBtn, { backgroundColor: colors.successSurface, borderColor: colors.success }]}
                  >
                    <Banknote size={15} color={colors.success} style={{ marginRight: 6 }} />
                    <Text style={[styles.paymentBtnText, { color: colors.success }]}>Valor total</Text>
                  </TouchableOpacity>
                </View>

                {dayBooking ? (
                  <View style={styles.rowBtns}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleSavePayment}
                      disabled={acting != null}
                      style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                    >
                      {acting === 'pay' ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.primaryBtnText}>Salvar pagamento</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleCancelLaunch}
                      disabled={acting != null}
                      style={[styles.dangerOutlineBtn, { borderColor: colors.error }]}
                    >
                      {acting === 'cancel-launch' ? (
                        <ActivityIndicator size="small" color={colors.error} />
                      ) : (
                        <Text style={[styles.dangerOutlineText, { color: colors.error }]}>Cancelar lançamento</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleLaunch}
                    disabled={acting != null}
                    style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 10 }]}
                  >
                    {acting === 'launch' ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <CheckCircle2 size={18} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={styles.primaryBtnText}>Confirmar dia + salvar pagamento</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            {/* Desmarcar / reativar só este dia */}
            <View style={[styles.skipBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {skipped ? 'Dia desmarcado' : 'Desmarcar só este dia'}
              </Text>
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                {skipped
                  ? 'Este dia está fora da série. Reative para voltar a cobrá-lo normalmente.'
                  : 'A série continua nos demais dias. Use para feriados, faltas e pausas pontuais.'}
              </Text>
              {skipped ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleUnskip}
                  disabled={acting != null || !exception?.id}
                  style={[styles.primaryBtn, { backgroundColor: colors.success, marginTop: 8 }]}
                >
                  {acting === 'unskip' ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <CalendarCheck size={16} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={styles.primaryBtnText}>Reativar este dia</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : !dayBooking ? (
                <>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 8 }]}>
                    <TextInput
                      style={[styles.input, { color: colors.textPrimary }]}
                      value={reason}
                      onChangeText={setReason}
                      placeholder="Motivo (opcional) — ex: feriado, time avisou falta"
                      placeholderTextColor={colors.textMuted}
                      editable={acting == null}
                    />
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSkip}
                    disabled={acting != null}
                    style={[styles.warnBtn, { backgroundColor: colors.warning ?? '#F59E0B', marginTop: 8 }]}
                  >
                    {acting === 'skip' ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <CalendarOff size={16} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={styles.primaryBtnText}>Desmarcar só este dia</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={[styles.hint, { color: colors.textMuted, marginTop: 6 }]}>
                  Para desmarcar, primeiro cancele o lançamento acima.
                </Text>
              )}
            </View>

            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Dias lançados contam nas estatísticas como agendamento normal. Dias desmarcados liberam o horário no app.
            </Text>
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            {onOpenEdit ? (
              <TouchableOpacity
                onPress={() => onOpenEdit?.(fixed)}
                style={[styles.footerBtn, { borderColor: colors.border }]}
                disabled={acting != null}
              >
                <Edit3 size={15} color={colors.textPrimary} style={{ marginRight: 6 }} />
                <Text style={[styles.footerBtnText, { color: colors.textPrimary }]}>Editar série</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={handleDeleteSeries}
              style={[styles.footerBtn, { borderColor: colors.error }]}
              disabled={acting === 'del'}
            >
              {acting === 'del' ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <>
                  <Trash2 size={15} color={colors.error} style={{ marginRight: 6 }} />
                  <Text style={[styles.footerBtnText, { color: colors.error }]}>Excluir série</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.footerBtnPrimary, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.primaryBtnText}>Fechar</Text>
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
    maxWidth: 540,
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
    gap: 8,
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
    borderWidth: 1, marginBottom: theme.spacing.sm,
  },
  errorText: { fontSize: theme.typography.sizes.caption, fontWeight: '600' },
  infoBox: {
    flexDirection: 'row', alignItems: 'center',
    padding: theme.spacing.sm, borderRadius: theme.radius.md,
    borderWidth: 1, marginBottom: theme.spacing.sm,
  },
  infoText: { flex: 1, fontSize: theme.typography.sizes.caption, fontWeight: '700' },
  centerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusBox: { borderWidth: 1, borderRadius: theme.radius.md, padding: 12, marginBottom: theme.spacing.md },
  sectionTitle: { fontSize: theme.typography.sizes.label, fontWeight: '800', marginBottom: 8 },
  launchedBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderWidth: 1, borderRadius: theme.radius.md, padding: 10,
  },
  launchedTitle: { fontSize: theme.typography.sizes.bodySmall, fontWeight: '800' },
  launchedSub: { fontSize: theme.typography.sizes.caption, marginTop: 2 },
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
  rowBtns: { flexDirection: 'row', gap: 8, marginTop: 10 },
  primaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: theme.radius.md,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: theme.typography.sizes.label, fontWeight: '800' },
  dangerOutlineBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: theme.radius.md, borderWidth: 1,
  },
  dangerOutlineText: { fontSize: theme.typography.sizes.label, fontWeight: '800' },
  warnBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: theme.radius.md,
  },
  skipBox: { borderWidth: 1, borderRadius: theme.radius.md, padding: 12, marginBottom: theme.spacing.md },
  hint: { fontSize: theme.typography.sizes.caption, lineHeight: 16, marginTop: 6 },
  modalFooter: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md, borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: theme.radius.md, borderWidth: 1,
  },
  footerBtnText: { fontSize: theme.typography.sizes.caption, fontWeight: '800' },
  footerBtnPrimary: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: theme.radius.md,
  },
});
