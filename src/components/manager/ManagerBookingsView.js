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
  ScrollView,
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
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { getUserBookings, cancelBooking, updateBookingPayment } from '../../api/bookings';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { FilterChip } from '../common/FilterChip';

function parseDateTime(value) {
  if (!value) return null;
  const d = new Date(String(value).replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
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
  const [paymentFilter, setPaymentFilter] = useState('all'); // all | paid | pending
  const [courtFilter, setCourtFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [togglingPaymentId, setTogglingPaymentId] = useState(null);

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

  const handleTogglePayment = async (booking) => {
    const nextPaid = !booking.is_paid;
    setTogglingPaymentId(booking.id);
    try {
      await updateBookingPayment(booking.id, nextPaid);
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, is_paid: nextPaid } : b)));
      onChanged && onChanged();
    } catch (err) {
      const apiMsg = err.response?.data?.message || err.message || 'Erro ao atualizar pagamento.';
      if (Platform.OS === 'web') {
        window.alert(apiMsg);
      } else {
        Alert.alert('Erro', apiMsg);
      }
    } finally {
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
    scoped.forEach((b) => {
      if (b.status === 'cancelled') {
        cancelados++;
      } else {
        const end = parseDateTime(b.end_time) || parseDateTime(b.start_time);
        if (end && end < now) realizados++;
        else futuros++;
        if (b.is_paid) pagos++;
        else pendentes++;
      }
    });
    return { todos: scoped.length, futuros, realizados, cancelados, pagos, pendentes };
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
        if (paymentFilter === 'paid' && !b.is_paid) return false;
        if (paymentFilter === 'pending' && (b.is_paid || b.status === 'cancelled')) return false;
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
    { id: 'paid', label: `Pagos (${counts.pagos})` },
    { id: 'pending', label: `Pendentes (${counts.pendentes})` },
  ];

  const renderCard = ({ item }) => {
    const isCancelled = item.status === 'cancelled';
    const isPaid = Boolean(item.is_paid);
    const isManual = Boolean(item.is_manual);
    const end = parseDateTime(item.end_time) || parseDateTime(item.start_time);
    const isPast = end ? end < new Date() : false;
    const client = item.customer_name || item.user?.name || 'Cliente';
    const phone = item.customer_phone || item.user?.phone || '—';
    const isTogglingPayment = togglingPaymentId === item.id;

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
            {!isCancelled ? (
              <View style={[styles.badge, { backgroundColor: isPaid ? colors.successSurface : colors.warningSurface }]}>
                <Banknote size={13} color={isPaid ? colors.success : colors.gold} style={{ marginRight: 4 }} />
                <Text style={[styles.badgeText, { color: isPaid ? colors.success : colors.gold }]}>
                  {isPaid ? 'PAGO' : 'PENDENTE'}
                </Text>
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
          <Text style={[styles.priceText, { color: colors.textPrimary }]}>
            R$ {item.total_price != null ? parseFloat(item.total_price).toFixed(2) : '—'}
          </Text>
          <View style={styles.footerActions}>
            {!isCancelled ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleTogglePayment(item)}
                disabled={isTogglingPayment}
                style={[
                  styles.btnPay,
                  {
                    backgroundColor: isPaid ? colors.successSurface : colors.warningSurface,
                    borderColor: isPaid ? colors.successSurface : colors.warningSurface,
                    opacity: isTogglingPayment ? 0.6 : 1,
                  },
                ]}
              >
                <Banknote size={13} color={isPaid ? colors.success : colors.gold} style={{ marginRight: 4 }} />
                <Text style={[styles.btnPayText, { color: isPaid ? colors.success : colors.gold }]}>
                  {isTogglingPayment ? '...' : isPaid ? 'Marcar pendente' : 'Marcar pago'}
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {filters.map((f) => (
            <FilterChip
              key={f.id}
              label={f.label}
              isSelected={statusFilter === f.id}
              onPress={() => setStatusFilter(f.id)}
            />
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {paymentFilters.map((f) => (
            <FilterChip
              key={f.id}
              label={f.label}
              isSelected={paymentFilter === f.id}
              onPress={() => setPaymentFilter(f.id)}
            />
          ))}
        </ScrollView>

        {courts.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
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
          </ScrollView>
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
});
