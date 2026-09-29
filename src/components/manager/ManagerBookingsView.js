import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import {
  Clock,
  User,
  Phone,
  Store,
  Smartphone,
  XCircle,
  CheckCircle,
  Search,
  FileText,
  Banknote,
  X,
  Repeat,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { getUserBookings, cancelBooking, updateBookingPayment } from '../../api/bookings';
import { parseServerDateTime } from '../../utils/datetime';
import {
  PAYMENT_PAGO,
  PAYMENT_PENDENTE,
  PAYMENT_NAO_PAGO,
  getPaymentStatus,
  getPaidAmount,
  getTotalPrice,
  getRemainingAmount,
  formatBRL,
  parseBRLInput,
  resolvePaymentStatus,
} from '../../utils/payment';
import { ScrollableRow } from '../common/ScrollableRow';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { FilterChip } from '../common/FilterChip';

function parseDateTime(value) {
  // Horário do servidor = America/Sao_Paulo (não o fuso do dispositivo).
  return parseServerDateTime(value);
}

function formatDateTime(start, end) {
  const s = parseDateTime(start);
  if (!s) return String(start || '--');
  const dd = String(s.getDate()).padStart(2, '0');
  const mm = String(s.getMonth() + 1).padStart(2, '0');
  const yyyy = s.getFullYear();
  const sh = String(s.getHours()).padStart(2, '0');
  const sm = String(s.getMinutes()).padStart(2, '0');
  const e = parseDateTime(end);
  const endStr = e ? ` - ${String(e.getHours()).padStart(2, '0')}:${String(e.getMinutes()).padStart(2, '0')}` : '';
  return `${dd}/${mm}/${yyyy} • ${sh}:${sm}${endStr}`;
}

/**
 * Aba "Agendamentos" do painel do gestor: lista todos os agendamentos
 * realizados (passados), futuros e cancelados do complexo ativo.
 */
export function ManagerBookingsView({ courts = [], activeVenueId = null, refreshKey = 0, onChanged }) {
  const { colors } = useTheme();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('todos'); // todos | futuros | realizados | cancelados
  const [paymentFilter, setPaymentFilter] = useState('all'); // all | pago | pendente | nao_pago
  const [courtFilter, setCourtFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [togglingPaymentId, setTogglingPaymentId] = useState(null);
  const [paymentModalBooking, setPaymentModalBooking] = useState(null);
  const [paymentInput, setPaymentInput] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const courtIds = useMemo(() => new Set(courts.map((c) => String(c.id))), [courts]);

  const fetchBookings = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const res = await getUserBookings({ all: true });
      const list = res?.data || (Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res) ? res : []);
      setBookings(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Erro ao carregar agendamentos do gestor:', err);
      setError('Não foi possível carregar os agendamentos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings, refreshKey]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings(true);
  };

  const handleCancel = (booking) => {
    const doCancel = async () => {
      try {
        await cancelBooking(booking.id);
        setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b)));
        onChanged && onChanged();
      } catch (err) {
        const apiMsg = err.response?.data?.message || err.message || 'Erro ao cancelar reserva.';
        if (Platform.OS === 'web') {
          window.alert(apiMsg);
        } else {
          Alert.alert('Erro', apiMsg);
        }
      }
    };
    const msg = `Cancelar a reserva de ${booking.customer_name || booking.user?.name || 'cliente'} em ${formatDateTime(booking.start_time, booking.end_time)}?`;
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) doCancel();
    } else {
      Alert.alert('Cancelar Reserva', msg, [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim, Cancelar', style: 'destructive', onPress: doCancel },
      ]);
    }
  };

  const openPaymentModal = (booking) => {
    setPaymentModalBooking(booking);
    setPaymentInput(String(getPaidAmount(booking) ?? 0));
    setPaymentError('');
  };

  const closePaymentModal = () => {
    if (savingPayment) return;
    setPaymentModalBooking(null);
    setPaymentInput('');
    setPaymentError('');
  };

  const handleSavePayment = async () => {
    if (!paymentModalBooking) return;
    const parsed = parseBRLInput(paymentInput);
    if (!Number.isFinite(parsed)) {
      setPaymentError('Informe um valor válido (ex: 40 ou 40,50).');
      return;
    }
    setSavingPayment(true);
    setTogglingPaymentId(paymentModalBooking.id);
    try {
      const res = await updateBookingPayment(paymentModalBooking.id, parsed);
      const updated = res?.booking || res;
      setBookings((prev) =>
        prev.map((b) => (b.id === paymentModalBooking.id ? { ...b, ...updated } : b)),
      );
      onChanged && onChanged();
      closePaymentModal();
    } catch (err) {
      const apiMsg =
        err.response?.data?.message || err.message || 'Erro ao atualizar pagamento.';
      setPaymentError(apiMsg);
    } finally {
      setSavingPayment(false);
      setTogglingPaymentId(null);
    }
  };

  const scoped = useMemo(() => {
    // Restringe aos agendamentos das quadras do complexo ativo (quando há quadras carregadas).
    return bookings.filter((b) => {
      if (courtIds.size > 0 && b.court_id != null && !courtIds.has(String(b.court_id))) return false;
      if (activeVenueId != null && b.court?.venue_id != null && String(b.court.venue_id) !== String(activeVenueId)) return false;
      if (activeVenueId != null && b.court?.venue?.id != null && String(b.court.venue.id) !== String(activeVenueId)) return false;
      return true;
    });
  }, [bookings, courtIds, activeVenueId]);

  const now = useMemo(() => new Date(), []);
  const counts = useMemo(() => {
    let futuros = 0;
    let realizados = 0;
    let cancelados = 0;
    let pagos = 0;
    let pendentes = 0;
    let naoPagos = 0;
    scoped.forEach((b) => {
      if (b.status === 'cancelled') {
        cancelados++;
      } else {
        const end = parseDateTime(b.end_time) || parseDateTime(b.start_time);
        if (end && end < now) realizados++;
        else futuros++;
        const ps = getPaymentStatus(b);
        if (ps === PAYMENT_PAGO) pagos++;
        else if (ps === PAYMENT_PENDENTE) pendentes++;
        else naoPagos++;
      }
    });
    return { todos: scoped.length, futuros, realizados, cancelados, pagos, pendentes, naoPagos };
  }, [scoped, now]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped
      .filter((b) => {
        if (courtFilter !== 'ALL' && String(b.court_id) !== String(courtFilter)) return false;
        if (statusFilter === 'cancelados' && b.status !== 'cancelled') return false;
        if (statusFilter !== 'cancelados' && statusFilter !== 'todos' && b.status === 'cancelled') return false;
        if (statusFilter === 'futuros') {
          const s = parseDateTime(b.start_time);
          if (!s || s < now) return false;
        }
        if (statusFilter === 'realizados') {
          const e = parseDateTime(b.end_time) || parseDateTime(b.start_time);
          if (!e || e >= now) return false;
        }
        const ps = getPaymentStatus(b);
        if (paymentFilter === 'pago' || paymentFilter === 'paid') {
          if (ps !== PAYMENT_PAGO) return false;
        }
        if (paymentFilter === 'pendente' || paymentFilter === 'pending') {
          if (ps !== PAYMENT_PENDENTE || b.status === 'cancelled') return false;
        }
        if (paymentFilter === 'nao_pago') {
          if (ps !== PAYMENT_NAO_PAGO || b.status === 'cancelled') return false;
        }
        if (q) {
          const hay = [
            b.customer_name,
            b.user?.name,
            b.customer_phone,
            b.user?.phone,
            b.court?.name,
            b.notes,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  }, [scoped, statusFilter, paymentFilter, courtFilter, search, now]);

  const filters = [
    { id: 'todos', label: `Todos (${counts.todos})` },
    { id: 'futuros', label: `Futuros (${counts.futuros})` },
    { id: 'realizados', label: `Realizados (${counts.realizados})` },
    { id: 'cancelados', label: `Cancelados (${counts.cancelados})` },
  ];

  const paymentFilters = [
    { id: 'all', label: 'Pagto: todos' },
    { id: 'pago', label: `Pagos (${counts.pagos})` },
    { id: 'pendente', label: `Pendentes (${counts.pendentes})` },
    { id: 'nao_pago', label: `Não pagos (${counts.naoPagos})` },
  ];

  const getPaymentBadgeStyle = (ps) => {
    if (ps === PAYMENT_PAGO) return { bg: colors.successSurface, fg: colors.success, label: 'PAGO' };
    if (ps === PAYMENT_PENDENTE) return { bg: colors.warningSurface, fg: colors.gold, label: 'PENDENTE' };
    return { bg: colors.errorSurface, fg: colors.error, label: 'NÃO PAGO' };
  };

  const renderCard = ({ item }) => {
    const isCancelled = item.status === 'cancelled';
    const paymentStatus = getPaymentStatus(item);
    const payBadge = getPaymentBadgeStyle(paymentStatus);
    const paid = getPaidAmount(item);
    const total = getTotalPrice(item);
    const remaining = getRemainingAmount(item);
    const isManual = Boolean(item.is_manual);
    const end = parseDateTime(item.end_time) || parseDateTime(item.start_time);
    const isPast = end ? end < new Date() : false;
    const client = item.customer_name || item.user?.name || 'Cliente';
    const phone = item.customer_phone || item.user?.phone || '—';
    const isTogglingPayment = togglingPaymentId === item.id;
    const isFixedDay = Boolean(
      item.court_fixed_schedule_id ?? item.fixed_schedule_id ?? item.fixedSchedule?.id,
    );

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border, opacity: isCancelled ? 0.65 : 1 },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.courtName, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.court?.name || 'Quadra'}
            </Text>
            <View style={styles.dateRow}>
              <Clock size={13} color={colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                {formatDateTime(item.start_time, item.end_time)}
              </Text>
            </View>
          </View>
          <View style={styles.badgesCol}>
            {isCancelled ? (
              <View style={[styles.badge, { backgroundColor: colors.errorSurface }]}>
                <XCircle size={13} color={colors.error} style={{ marginRight: 4 }} />
                <Text style={[styles.badgeText, { color: colors.error }]}>CANCELADO</Text>
              </View>
            ) : isPast ? (
              <View style={[styles.badge, { backgroundColor: colors.successSurface }]}>
                <CheckCircle size={13} color={colors.success} style={{ marginRight: 4 }} />
                <Text style={[styles.badgeText, { color: colors.success }]}>REALIZADO</Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                <Clock size={13} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>AGENDADO</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: payBadge.bg }]}>
              <Banknote size={13} color={payBadge.fg} style={{ marginRight: 4 }} />
              <Text style={[styles.badgeText, { color: payBadge.fg }]}>
                {payBadge.label}
              </Text>
            </View>
            {isFixedDay ? (
              <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                <Repeat size={13} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>FIXO</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.infoRow}>
          <User size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
          <Text style={[styles.infoText, { color: colors.textPrimary }]}>{client}</Text>
          <View style={[styles.originBadge, { backgroundColor: isManual ? colors.holdingSurface : colors.infoSurface, marginLeft: 8 }]}>
            {isManual ? (
              <Store size={12} color={colors.holding} style={{ marginRight: 3 }} />
            ) : (
              <Smartphone size={12} color={colors.info} style={{ marginRight: 3 }} />
            )}
            <Text style={[styles.originText, { color: isManual ? colors.holding : colors.info }]}>
              {isManual ? 'BALCÃO' : 'APP'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Phone size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>{phone}</Text>
        </View>

        {item.notes ? (
          <View style={styles.infoRow}>
            <FileText size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
            <Text style={[styles.infoText, { color: colors.textSecondary, fontStyle: 'italic' }]} numberOfLines={2}>
              {item.notes}
            </Text>
          </View>
        ) : null}

        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View>
            <Text style={[styles.priceText, { color: colors.textPrimary }]}>
              {formatBRL(total)}
            </Text>
            {paymentStatus !== PAYMENT_PAGO ? (
              <Text style={[styles.remainingText, { color: colors.textMuted }]}>
                Pago {formatBRL(paid)} • Falta {formatBRL(remaining)}
              </Text>
            ) : (
              <Text style={[styles.remainingText, { color: colors.success }]}>
                Pago {formatBRL(paid)}
              </Text>
            )}
          </View>
          <View style={styles.footerActions}>
            {!isCancelled ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openPaymentModal(item)}
                disabled={isTogglingPayment}
                style={[
                  styles.btnPay,
                  {
                    backgroundColor: payBadge.bg,
                    borderColor: payBadge.bg,
                    opacity: isTogglingPayment ? 0.6 : 1,
                  },
                ]}
              >
                <Banknote size={13} color={payBadge.fg} style={{ marginRight: 4 }} />
                <Text style={[styles.btnPayText, { color: payBadge.fg }]}>
                  {isTogglingPayment ? '...' : 'Registrar pagamento'}
                </Text>
              </TouchableOpacity>
            ) : null}
            {!isCancelled && !isPast ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleCancel(item)}
                style={[styles.btnCancel, { backgroundColor: colors.errorSurface, borderColor: colors.error }]}
              >
                <XCircle size={13} color={colors.error} style={{ marginRight: 4 }} />
                <Text style={[styles.btnCancelText, { color: colors.error }]}>Cancelar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.toolbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Search size={15} color={colors.textMuted} style={{ marginRight: 6 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Buscar por cliente, telefone ou quadra..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollableRow edgeColor={colors.surface} contentContainerStyle={styles.chipsRow} accessibilityLabel="Filtro de status. Arraste para o lado para ver mais opções">
          {filters.map((f) => (
            <FilterChip
              key={f.id}
              label={f.label}
              isSelected={statusFilter === f.id}
              onPress={() => setStatusFilter(f.id)}
            />
          ))}
        </ScrollableRow>

        <ScrollableRow edgeColor={colors.surface} contentContainerStyle={styles.chipsRow} accessibilityLabel="Filtro de pagamento. Arraste para o lado para ver mais opções">
          {paymentFilters.map((f) => (
            <FilterChip
              key={f.id}
              label={f.label}
              isSelected={paymentFilter === f.id}
              onPress={() => setPaymentFilter(f.id)}
            />
          ))}
        </ScrollableRow>

        {courts.length > 1 ? (
          <ScrollableRow edgeColor={colors.surface} contentContainerStyle={styles.chipsRow} accessibilityLabel="Filtro por quadra. Arraste para o lado para ver mais quadras">
            <FilterChip
              label="Todas as quadras"
              isSelected={courtFilter === 'ALL'}
              onPress={() => setCourtFilter('ALL')}
            />
            {courts.map((c) => (
              <FilterChip
                key={c.id}
                label={c.name}
                isSelected={String(courtFilter) === String(c.id)}
                onPress={() => setCourtFilter(c.id)}
              />
            ))}
          </ScrollableRow>
        ) : null}
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.centerText, { color: colors.textMuted }]}>Carregando agendamentos...</Text>
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchBookings()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhum agendamento encontrado"
          message="Não há agendamentos para o filtro selecionado."
          onResetFilters={() => {
            setStatusFilter('todos');
            setPaymentFilter('all');
            setCourtFilter('ALL');
            setSearch('');
          }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCard}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
          }
        />
      )}

      <Modal
        animationType="slide"
        transparent
        visible={!!paymentModalBooking}
        onRequestClose={closePaymentModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Registrar pagamento</Text>
                {paymentModalBooking ? (
                  <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                    {paymentModalBooking.court?.name || 'Quadra'} • Total {formatBRL(getTotalPrice(paymentModalBooking))}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={closePaymentModal} style={[styles.modalClose, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <X size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {paymentError ? (
                <View style={[styles.modalError, { backgroundColor: colors.errorSurface, borderColor: colors.error }]}>
                  <Text style={[styles.modalErrorText, { color: colors.error }]}>{paymentError}</Text>
                </View>
              ) : null}

              <Text style={[styles.modalLabel, { color: colors.textPrimary }]}>Quanto foi pago? (R$)</Text>
              <View style={[styles.modalInputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Banknote size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.modalInput, { color: colors.textPrimary }]}
                  value={paymentInput}
                  onChangeText={setPaymentInput}
                  placeholder="Ex: 40"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  editable={!savingPayment}
                />
              </View>

              <View style={styles.quickRow}>
                <TouchableOpacity
                  style={[styles.quickBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={() => setPaymentInput('0')}
                  disabled={savingPayment}
                >
                  <Text style={[styles.quickBtnText, { color: colors.textSecondary }]}>Não pago</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={() => {
                    if (!paymentModalBooking) return;
                    const total = getTotalPrice(paymentModalBooking);
                    setPaymentInput(String(Math.floor(total / 2)));
                  }}
                  disabled={savingPayment}
                >
                  <Text style={[styles.quickBtnText, { color: colors.textSecondary }]}>Metade</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickBtn, { borderColor: colors.success, backgroundColor: colors.successSurface }]}
                  onPress={() => {
                    if (!paymentModalBooking) return;
                    setPaymentInput(String(getTotalPrice(paymentModalBooking)));
                  }}
                  disabled={savingPayment}
                >
                  <Text style={[styles.quickBtnText, { color: colors.success }]}>Valor total</Text>
                </TouchableOpacity>
              </View>

              {paymentModalBooking ? (
                <View style={[styles.previewBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  {(() => {
                    const parsed = parseBRLInput(paymentInput);
                    const total = getTotalPrice(paymentModalBooking);
                    const preview = Number.isFinite(parsed) ? resolvePaymentStatus(parsed, total) : null;
                    const over = Number.isFinite(parsed) && parsed > total;
                    const label = over ? `ACIMA DO TOTAL (${formatBRL(total)}) — será recusado` : preview === PAYMENT_PAGO ? 'PAGO (valor integral)' : preview === PAYMENT_PENDENTE ? `PENDENTE (falta ${formatBRL(Math.max(0, total - parsed))})` : preview === PAYMENT_NAO_PAGO ? 'NÃO PAGO' : '—';
                    const fg = over ? colors.error : preview === PAYMENT_PAGO ? colors.success : preview === PAYMENT_PENDENTE ? colors.gold : colors.error;
                    return (
                      <Text style={[styles.previewText, { color: colors.textSecondary }]}>
                        O sistema vai marcar como: <Text style={{ fontWeight: '800', color: fg }}>{label}</Text>
                      </Text>
                    );
                  })()}
                </View>
              ) : null}
            </View>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity onPress={closePaymentModal} style={[styles.modalCancel, { borderColor: colors.border }]} disabled={savingPayment}>
                <Text style={[styles.modalCancelText, { color: colors.textPrimary }]}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSavePayment}
                style={[styles.modalSave, { backgroundColor: colors.primary, opacity: savingPayment ? 0.6 : 1 }]}
                disabled={savingPayment}
              >
                <Text style={styles.modalSaveText}>{savingPayment ? 'Salvando...' : 'Salvar valor'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    gap: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.label,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    paddingRight: theme.spacing.md,
  },
  list: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  courtName: {
    fontSize: 14,
    fontWeight: '800',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  dateText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  badgeText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '800',
  },
  badgesCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    fontSize: theme.typography.sizes.label,
    flexShrink: 1,
  },
  originBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.xs || 4,
  },
  originText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
  },
  remainingText: {
    fontSize: 11,
    marginTop: 2,
  },
  btnCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  btnCancelText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '700',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnPay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  btnPayText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  centerText: {
    marginTop: 10,
    fontSize: theme.typography.sizes.label,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '96%',
    maxWidth: 440,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    gap: 8,
  },
  modalTitle: { fontSize: 15, fontWeight: '800' },
  modalSubtitle: { fontSize: 12, marginTop: 2 },
  modalClose: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  modalBody: { padding: theme.spacing.md, gap: 10 },
  modalLabel: { fontSize: 13, fontWeight: '700' },
  modalInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: theme.radius.md,
    paddingHorizontal: 12, height: 46,
  },
  modalInput: { flex: 1, fontSize: 16, fontWeight: '700' },
  modalError: { padding: 10, borderRadius: theme.radius.md, borderWidth: 1 },
  modalErrorText: { fontSize: 12, fontWeight: '600' },
  quickRow: { flexDirection: 'row', gap: 8 },
  quickBtn: {
    flex: 1, paddingVertical: 9, borderRadius: theme.radius.md,
    borderWidth: 1, alignItems: 'center',
  },
  quickBtnText: { fontSize: 12, fontWeight: '700' },
  previewBox: { padding: 10, borderRadius: theme.radius.md, borderWidth: 1 },
  previewText: { fontSize: 12 },
  modalFooter: {
    flexDirection: 'row', gap: 8,
    padding: theme.spacing.md, borderTopWidth: 1,
  },
  modalCancel: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: theme.radius.md, borderWidth: 1,
  },
  modalCancelText: { fontSize: 13, fontWeight: '700' },
  modalSave: {
    flex: 1.4, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: theme.radius.md,
  },
  modalSaveText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
