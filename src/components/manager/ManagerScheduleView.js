import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Store,
  Smartphone,
  XCircle,
  Plus,
  Filter,
  CheckCircle,
  AlertCircle,
  FileText,
  Grid,
  List,
  PlusCircle,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { getUserBookings, cancelBooking } from '../../api/bookings';
import { EmptyState } from '../common/EmptyState';

export function ManagerScheduleView({ courts = [], onOpenManualModal }) {
  const { colors, isDark } = useTheme();

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [selectedCourtId, setSelectedCourtId] = useState('ALL'); // 'ALL' or courtId
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Horários operacionais padrão para a grade visual (07:00 às 22:00)
  const timeSlots = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00', '22:00'
  ];

  // Gera lista de datas para atalhos rápidos (Próximos 7 dias)
  const generateDateChips = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : d.toLocaleDateString('pt-BR', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthStr = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      dates.push({ dateStr, dayLabel, dayNum, monthStr });
    }
    return dates;
  };

  const dateChips = generateDateChips();

  const fetchScheduleData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);

    try {
      const response = await getUserBookings({ date: selectedDate });
      const list = response?.data || (Array.isArray(response) ? response : []);
      setBookings(list);
    } catch (err) {
      console.error('Erro ao carregar agenda do gestor:', err);
      setError('Não foi possível carregar os agendamentos da data selecionada.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchScheduleData(true);
  };

  const handleCancelBooking = (booking) => {
    const doCancel = async () => {
      try {
        await cancelBooking(booking.id);
        setBookings((prev) =>
          prev.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b))
        );
      } catch (err) {
        console.error('Erro ao cancelar reserva:', err);
      }
    };

    const confirmMessage = `Deseja realmente cancelar a reserva das ${booking.start_time?.substring(11, 16) || 'horário'} na quadra "${booking.court?.name || 'Quadra'}"?`;

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        doCancel();
      }
    } else {
      Alert.alert(
        'Cancelar Reserva',
        confirmMessage,
        [
          { text: 'Não', style: 'cancel' },
          { text: 'Sim, Cancelar', style: 'destructive', onPress: doCancel },
        ]
      );
    }
  };

  // Filtragem local por quadra
  const activeCourtsList = courts.length > 0 ? courts : [
    { id: 1, name: 'Quadra Society 1 - Coberta', hourly_rate: 140 },
    { id: 2, name: 'Quadra de Saibro A - Coberta', hourly_rate: 180 },
  ];

  const visibleCourts = selectedCourtId === 'ALL'
    ? activeCourtsList
    : activeCourtsList.filter((c) => String(c.id) === String(selectedCourtId));

  const filteredBookings = bookings.filter((b) => {
    if (selectedCourtId === 'ALL') return true;
    return String(b.court_id) === String(selectedCourtId);
  });

  // Métricas do Dia
  const confirmedCount = filteredBookings.filter((b) => b.status !== 'cancelled').length;
  const manualCount = filteredBookings.filter((b) => b.is_manual && b.status !== 'cancelled').length;

  return (
    <View style={styles.container}>
      {/* Seletor de Datas (Grade FlexWrap para Desktop e Mobile) */}
      <View style={[styles.datesContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.datesWrapContainer}>
          {dateChips.map((chip) => {
            const isSelected = selectedDate === chip.dateStr;
            return (
              <TouchableOpacity
                key={chip.dateStr}
                activeOpacity={0.7}
                onPress={() => setSelectedDate(chip.dateStr)}
                style={[
                  styles.dateChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.background,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.dateChipDay, { color: isSelected ? '#FFFFFF' : colors.textMuted }]}>
                  {chip.dayLabel}
                </Text>
                <Text style={[styles.dateChipNum, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                  {chip.dayNum} {chip.monthStr}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Filtro por Quadra (FlexWrap) */}
        {activeCourtsList.length > 0 ? (
          <View style={styles.courtFilterWrapContainer}>
            <TouchableOpacity
              onPress={() => setSelectedCourtId('ALL')}
              style={[
                styles.courtFilterChip,
                {
                  backgroundColor: selectedCourtId === 'ALL' ? colors.primary + '20' : 'transparent',
                  borderColor: selectedCourtId === 'ALL' ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.courtFilterText,
                  { color: selectedCourtId === 'ALL' ? colors.primary : colors.textMuted },
                ]}
              >
                Todas as Quadras
              </Text>
            </TouchableOpacity>

            {activeCourtsList.map((court) => {
              const isSelected = String(selectedCourtId) === String(court.id);
              return (
                <TouchableOpacity
                  key={court.id}
                  onPress={() => setSelectedCourtId(court.id)}
                  style={[
                    styles.courtFilterChip,
                    {
                      backgroundColor: isSelected ? colors.primary + '20' : 'transparent',
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.courtFilterText,
                      { color: isSelected ? colors.primary : colors.textMuted },
                    ]}
                  >
                    {court.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </View>

      {/* Faixa de Métricas + Alternador de Modo (Grid Matrix vs Lista) */}
      <View style={styles.metricsBar}>
        <View style={styles.metricsLeft}>
          <Text style={[styles.metricsText, { color: colors.text }]}>
            <Text style={{ fontWeight: '800' }}>{confirmedCount}</Text> reservas no dia ({manualCount} balcão)
          </Text>
        </View>

        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setViewMode('grid')}
            style={[
              styles.toggleBtn,
              {
                backgroundColor: viewMode === 'grid' ? colors.primary : colors.background,
                borderColor: viewMode === 'grid' ? colors.primary : colors.border,
              },
            ]}
          >
            <Grid size={15} color={viewMode === 'grid' ? '#FFFFFF' : colors.textMuted} />
            <Text style={[styles.toggleBtnText, { color: viewMode === 'grid' ? '#FFFFFF' : colors.textMuted }]}>
              Grade Matrix
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setViewMode('list')}
            style={[
              styles.toggleBtn,
              {
                backgroundColor: viewMode === 'list' ? colors.primary : colors.background,
                borderColor: viewMode === 'list' ? colors.primary : colors.border,
              },
            ]}
          >
            <List size={15} color={viewMode === 'list' ? '#FFFFFF' : colors.textMuted} />
            <Text style={[styles.toggleBtnText, { color: viewMode === 'list' ? '#FFFFFF' : colors.textMuted }]}>
              Lista
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Legenda de Cores (Apenas no Modo Grade Matrix) */}
      {viewMode === 'grid' ? (
        <View style={[styles.legendBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>Livre (Clique p/ agendar)</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>Balcão / Presencial</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>Via App</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>Cancelado</Text>
          </View>
        </View>
      ) : null}

      {/* Conteúdo Principal da Agenda */}
      <View style={styles.listContainer}>
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Carregando agenda visual...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <AlertCircle size={36} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          </View>
        ) : viewMode === 'grid' ? (
          /* Visão em GRADE MATRIX / TIMELINE */
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridScrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            {visibleCourts.map((court) => (
              <CourtMatrixRow
                key={court.id}
                court={court}
                timeSlots={timeSlots}
                selectedDate={selectedDate}
                bookings={bookings.filter((b) => String(b.court_id) === String(court.id))}
                onSlotClick={(slotInfo) => {
                  if (slotInfo.booking) {
                    // Clicou em agendamento existente -> Exibe detalhes ou opção de cancelar
                    const b = slotInfo.booking;
                    const client = b.customer_name || b.user?.name || 'Cliente';
                    const origin = b.is_manual ? 'Balcão / Presencial' : 'Aplicativo';
                    const confirmMsg = `Reserva: ${client}\nOrigem: ${origin}\nHorário: ${b.start_time.substring(11, 16)} às ${b.end_time.substring(11, 16)}\n\nDeseja cancelar esta reserva?`;

                    if (Platform.OS === 'web') {
                      if (window.confirm(confirmMsg)) {
                        handleCancelBooking(b);
                      }
                    } else {
                      Alert.alert(
                        'Detalhes do Agendamento',
                        confirmMsg,
                        [
                          { text: 'Fechar', style: 'cancel' },
                          { text: 'Cancelar Reserva', style: 'destructive', onPress: () => handleCancelBooking(b) },
                        ]
                      );
                    }
                  } else {
                    // Clicou em slot LIVRE -> Abre modal com quadra e horário pré-selecionados!
                    onOpenManualModal?.({
                      courtId: court.id,
                      startTime: slotInfo.startTime,
                      endTime: slotInfo.endTime,
                      date: selectedDate,
                    });
                  }
                }}
              />
            ))}
          </ScrollView>
        ) : (
          /* Visão em LISTA DETALHADA */
          filteredBookings.length === 0 ? (
            <EmptyState
              title="Nenhum agendamento para este dia"
              message="Não há reservas registradas para esta data/quadra. Clique no botão de agendamento para realizar uma reserva."
            />
          ) : (
            <FlatList
              data={filteredBookings}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <BookingScheduleCard booking={item} onCancel={handleCancelBooking} />
              )}
              contentContainerStyle={styles.listPadding}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            />
          )
        )}
      </View>
    </View>
  );
}

/**
 * Componente que renderiza a matriz de horários em grade (bloco multi-colunas) para uma quadra específica.
 */
function CourtMatrixRow({ court, timeSlots, selectedDate, bookings, onSlotClick }) {
  const { colors } = useTheme();

  // Contadores para o header da quadra
  let freeCount = 0;
  let bookedCount = 0;

  timeSlots.forEach((time) => {
    const b = bookings.find((bk) => bk.start_time?.substring(11, 16) === time);
    if (b && b.status !== 'cancelled') {
      bookedCount++;
    } else {
      freeCount++;
    }
  });

  return (
    <View style={[styles.matrixCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.matrixCardHeader, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.matrixCourtName, { color: colors.text }]}>{court.name}</Text>
          <Text style={[styles.matrixCourtStats, { color: colors.textMuted }]}>
            {freeCount} disponíveis • {bookedCount} ocupados
          </Text>
        </View>
        <Text style={[styles.matrixCourtPrice, { color: colors.primary }]}>
          R$ {court.hourly_rate ? parseFloat(court.hourly_rate).toFixed(0) : '140'}/h
        </Text>
      </View>

      <View style={styles.gridWrapContainer}>
        {timeSlots.map((time) => {
          const hour = parseInt(time.split(':')[0], 10);
          const nextHourStr = `${String(hour + 1).padStart(2, '0')}:00`;

          // Busca booking correspondente a este slot de 1 hora
          const matchingBooking = bookings.find((b) => {
            const bStart = b.start_time?.substring(11, 16);
            return bStart === time;
          });

          let status = 'free'; // 'free' | 'booked_manual' | 'booked_app' | 'cancelled'
          if (matchingBooking) {
            if (matchingBooking.status === 'cancelled') {
              status = 'cancelled';
            } else if (matchingBooking.is_manual) {
              status = 'booked_manual';
            } else {
              status = 'booked_app';
            }
          }

          return (
            <TouchableOpacity
              key={time}
              activeOpacity={0.7}
              onPress={() => onSlotClick({ startTime: time, endTime: nextHourStr, booking: matchingBooking })}
              style={[
                styles.matrixSlotTile,
                status === 'free' && { backgroundColor: '#10B98112', borderColor: '#10B98150' },
                status === 'booked_manual' && { backgroundColor: '#8B5CF620', borderColor: '#8B5CF6' },
                status === 'booked_app' && { backgroundColor: '#3B82F620', borderColor: '#3B82F6' },
                status === 'cancelled' && { backgroundColor: colors.error + '15', borderColor: colors.error + '40' },
              ]}
            >
              <View style={styles.tileHeaderRow}>
                <Clock size={11} color={colors.textMuted} style={{ marginRight: 3 }} />
                <Text style={[styles.slotTimeText, { color: colors.text }]}>{time}</Text>
              </View>

              {status === 'free' ? (
                <View style={styles.slotFreeContent}>
                  <PlusCircle size={13} color="#10B981" />
                  <Text style={styles.slotFreeText}>Livre</Text>
                </View>
              ) : status === 'booked_manual' ? (
                <View style={styles.slotBookedContent}>
                  <Store size={13} color="#8B5CF6" />
                  <Text numberOfLines={1} style={[styles.slotClientText, { color: '#8B5CF6' }]}>
                    {matchingBooking.customer_name?.split(' ')[0] || 'Balcão'}
                  </Text>
                </View>
              ) : status === 'booked_app' ? (
                <View style={styles.slotBookedContent}>
                  <Smartphone size={13} color="#3B82F6" />
                  <Text numberOfLines={1} style={[styles.slotClientText, { color: '#3B82F6' }]}>
                    {(matchingBooking.customer_name || matchingBooking.user?.name)?.split(' ')[0] || 'App'}
                  </Text>
                </View>
              ) : (
                <View style={styles.slotBookedContent}>
                  <XCircle size={13} color={colors.error} />
                  <Text style={[styles.slotClientText, { color: colors.error }]}>Canc.</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function BookingScheduleCard({ booking, onCancel }) {
  const { colors } = useTheme();

  const isCancelled = booking.status === 'cancelled';
  const isManual = Boolean(booking.is_manual);

  const startTimeStr = booking.start_time ? booking.start_time.substring(11, 16) : '--:--';
  const endTimeStr = booking.end_time ? booking.end_time.substring(11, 16) : '--:--';

  const clientName = booking.customer_name || booking.user?.name || 'Cliente';
  const clientPhone = booking.customer_phone || booking.user?.phone || 'Não informado';

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.surface,
          borderColor: isCancelled ? colors.border : colors.border,
          opacity: isCancelled ? 0.6 : 1,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        {/* Slot Time Badge */}
        <View style={[styles.timeBadge, { backgroundColor: colors.primary + '18' }]}>
          <Clock size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.timeBadgeText, { color: colors.primary }]}>
            {startTimeStr} - {endTimeStr}
          </Text>
        </View>

        {/* Origin Badge (App vs Balcão) */}
        <View
          style={[
            styles.originBadge,
            { backgroundColor: isManual ? '#8B5CF618' : '#10B98118' },
          ]}
        >
          {isManual ? (
            <Store size={14} color="#8B5CF6" style={{ marginRight: 4 }} />
          ) : (
            <Smartphone size={14} color="#10B981" style={{ marginRight: 4 }} />
          )}
          <Text
            style={[
              styles.originBadgeText,
              { color: isManual ? '#8B5CF6' : '#10B981' },
            ]}
          >
            {isManual ? 'BALCÃO' : 'VIA APP'}
          </Text>
        </View>

        {/* Status Badge */}
        {isCancelled ? (
          <View style={[styles.statusBadge, { backgroundColor: colors.error + '18' }]}>
            <XCircle size={14} color={colors.error} style={{ marginRight: 4 }} />
            <Text style={[styles.statusBadgeText, { color: colors.error }]}>CANCELADO</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, { backgroundColor: '#10B98118' }]}>
            <CheckCircle size={14} color="#10B981" style={{ marginRight: 4 }} />
            <Text style={[styles.statusBadgeText, { color: '#10B981' }]}>CONFIRMADO</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.courtNameText, { color: colors.text }]}>
          {booking.court?.name || 'Quadra Esportiva'}
        </Text>

        <View style={styles.infoRow}>
          <User size={15} color={colors.textMuted} style={{ marginRight: 6 }} />
          <Text style={[styles.infoText, { color: colors.text }]}>{clientName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Phone size={15} color={colors.textMuted} style={{ marginRight: 6 }} />
          <Text style={[styles.infoText, { color: colors.textMuted }]}>{clientPhone}</Text>
        </View>

        {booking.notes ? (
          <View style={styles.infoRow}>
            <FileText size={15} color={colors.textMuted} style={{ marginRight: 6 }} />
            <Text style={[styles.infoText, { color: colors.textMuted, fontStyle: 'italic' }]}>
              {booking.notes}
            </Text>
          </View>
        ) : null}
      </View>

      {!isCancelled ? (
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <Text style={[styles.priceText, { color: colors.text }]}>
            R$ {booking.total_price ? parseFloat(booking.total_price).toFixed(2) : '140.00'}
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onCancel(booking)}
            style={[styles.btnCancel, { backgroundColor: colors.error + '12', borderColor: colors.error + '30' }]}
          >
            <XCircle size={14} color={colors.error} style={{ marginRight: 4 }} />
            <Text style={[styles.btnCancelText, { color: colors.error }]}>Cancelar Reserva</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  datesContainer: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  datesWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.md,
    gap: 8,
    paddingBottom: theme.spacing.xs,
  },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 80,
  },
  dateChipDay: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateChipNum: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  courtFilterWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.md,
    gap: 6,
    paddingTop: theme.spacing.xs,
  },
  courtFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  courtFilterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  metricsLeft: {
    flex: 1,
  },
  metricsText: {
    fontSize: theme.typography.sizes.body2,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 4,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  legendBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  gridScrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  matrixCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  matrixCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  matrixCourtName: {
    fontSize: theme.typography.sizes.body1,
    fontWeight: '800',
  },
  matrixCourtStats: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  matrixCourtPrice: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '800',
  },
  gridWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.sm,
    gap: 8,
  },
  matrixSlotTile: {
    width: '23%', // 4 colunas em cada linha da quadra
    minWidth: 74,
    height: 60,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    padding: 6,
    justifyContent: 'space-between',
  },
  tileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotTimeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  slotFreeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotFreeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  slotBookedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotClientText: {
    fontSize: 10,
    fontWeight: '800',
    flex: 1,
  },
  listPadding: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.xs,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.body2,
  },
  errorText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.body2,
    textAlign: 'center',
  },
  cardContainer: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.md,
  },
  timeBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  originBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  originBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardBody: {
    gap: 4,
    marginBottom: theme.spacing.sm,
  },
  courtNameText: {
    fontSize: theme.typography.sizes.body1,
    fontWeight: '800',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    marginTop: 4,
  },
  priceText: {
    fontSize: theme.typography.sizes.body1,
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
    fontSize: 12,
    fontWeight: '700',
  },
});
