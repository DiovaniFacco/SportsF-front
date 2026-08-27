import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
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
  PlusCircle,
  ShieldAlert,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { getUserBookings, cancelBooking } from '../../api/bookings';
import { getCourtBlocks, deleteCourtBlock } from '../../api/courtBlocks';
import { getAvailableSlots } from '../../api/slots';
import { EmptyState } from '../common/EmptyState';
import { ManagerMetricsCards } from './ManagerMetricsCards';

export function ManagerScheduleView({ courts = [], onOpenManualModal, onOpenBlockModal, refreshKey, headerComponent }) {
  const { colors } = useTheme();

  const getTodayStr = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [selectedCourtId, setSelectedCourtId] = useState('ALL'); // 'ALL' or courtId

  const [bookings, setBookings] = useState([]);
  const [courtBlocks, setCourtBlocks] = useState([]);
  const [courtSlotsMap, setCourtSlotsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Lista de quadras ativas
  const activeCourtsList = courts.length > 0 ? courts : [
    { id: 1, name: 'Quadra Society 1 - Grama FIFA 50mm', hourly_rate: 150 },
    { id: 2, name: 'Quadra Society 2 - Coberta VIP', hourly_rate: 180 },
  ];

  // Gera lista de datas para atalhos rápidos (Próximos 7 dias)
  const generateDateChips = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
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
      const [bookingsRes, blocksRes] = await Promise.all([
        getUserBookings({ date: selectedDate }),
        getCourtBlocks({ date: selectedDate }),
      ]);
      const list = bookingsRes?.data || (Array.isArray(bookingsRes) ? bookingsRes : []);
      const blocksList = blocksRes?.data || (Array.isArray(blocksRes) ? blocksRes : []);
      setBookings(list);
      setCourtBlocks(blocksList);

      // Busca a grade real de slots e turnos de cada quadra ativada para o gestor
      if (activeCourtsList.length > 0) {
        const slotsResults = await Promise.all(
          activeCourtsList.map(async (court) => {
            try {
              const res = await getAvailableSlots(court.id, selectedDate, { includePast: true });
              return { courtId: court.id, slotsData: res };
            } catch (err) {
              console.warn(`Erro ao carregar slots da quadra ${court.id}:`, err);
              return { courtId: court.id, slotsData: { slots: [], operating: false } };
            }
          })
        );

        const newSlotsMap = {};
        slotsResults.forEach((item) => {
          newSlotsMap[item.courtId] = item.slotsData;
        });
        setCourtSlotsMap(newSlotsMap);
      }
    } catch (err) {
      console.error('Erro ao carregar agenda e bloqueios do gestor:', err);
      setError('Não foi possível carregar os agendamentos da data selecionada.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, activeCourtsList]);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData, refreshKey]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchScheduleData(true);
  };

  const handleRemoveBlock = (block) => {
    const doUnblock = async () => {
      try {
        await deleteCourtBlock(block.id);
        setCourtBlocks((prev) => prev.filter((b) => b.id !== block.id));
        fetchScheduleData(true);
      } catch (err) {
        console.error('Erro ao remover bloqueio:', err);
      }
    };

    const confirmMsg = `Remover o bloqueio "${block.reason || 'Manutenção'}" na quadra? O horário voltará a ficar disponível.`;

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        doUnblock();
      }
    } else {
      Alert.alert('Desbloquear Quadra', confirmMsg, [
        { text: 'Manter Bloqueado', style: 'cancel' },
        { text: 'Liberar Quadra', style: 'destructive', onPress: doUnblock },
      ]);
    }
  };

  const handleCancelBooking = (booking) => {
    const doCancel = async () => {
      try {
        await cancelBooking(booking.id);
        setBookings((prev) =>
          prev.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b))
        );
        fetchScheduleData(true);
      } catch (err) {
        console.error('Erro ao cancelar reserva:', err);
        let apiMsg = err.response?.data?.message || err.message || 'Erro ao cancelar reserva.';
        if (err.response?.data?.errors) {
          const firstError = Object.values(err.response.data.errors)[0];
          if (firstError && firstError.length > 0) {
            apiMsg = firstError[0];
          }
        }
        Alert.alert('Erro', apiMsg);
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

  const visibleCourts = selectedCourtId === 'ALL'
    ? activeCourtsList
    : activeCourtsList.filter((c) => String(c.id) === String(selectedCourtId));

  // Controles FIXOS: seletor de datas e filtro por quadra ficam sempre visíveis,
  // fora da rolagem, para manter o contexto da agenda em telas pequenas.
  const renderFixedControls = () => (
    <View style={[styles.fixedControls, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      {/* Seletor de Datas (Chips Horizontais) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.datesScrollContent}
      >
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
      </ScrollView>

      {/* Filtro por Quadra */}
      {activeCourtsList.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courtFilterScrollContainer}
        >
          <TouchableOpacity
            onPress={() => setSelectedCourtId('ALL')}
            style={[
              styles.courtFilterChip,
              {
                backgroundColor: selectedCourtId === 'ALL' ? colors.primary : colors.background,
                borderColor: selectedCourtId === 'ALL' ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.courtFilterText,
                { color: selectedCourtId === 'ALL' ? '#FFFFFF' : colors.text },
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
                    backgroundColor: isSelected ? colors.primary : colors.background,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.courtFilterText,
                    { color: isSelected ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {court.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );

  // Controles que rolam junto com a grade (ações e legenda)
  const renderScrollControls = () => (
    <>
      {/* Faixa de Ações + Alternador de Modo (Grid Matrix vs Lista) */}
      <View style={styles.metricsBar}>
        <View style={styles.metricsLeft}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onOpenManualModal?.()}
            style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
          >
            <Plus size={14} color="#FFFFFF" />
            <Text style={styles.primaryActionBtnText}>Novo Agendamento</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onOpenBlockModal}
            style={[styles.blockBtnHeader, { backgroundColor: colors.error + '18', borderColor: colors.error + '40' }]}
          >
            <ShieldAlert size={14} color={colors.error} style={{ marginRight: 4 }} />
            <Text style={[styles.blockBtnHeaderText, { color: colors.error }]}>Bloquear Horários</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.viewToggleContainer}>
          <View
            style={[
              styles.toggleBtn,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
          >
            <Grid size={15} color="#FFFFFF" />
            <Text style={[styles.toggleBtnText, { color: '#FFFFFF' }]}>
              Grade Matrix
            </Text>
          </View>
        </View>
      </View>

      {/* Legenda de Cores (linha única com rolagem horizontal para não empilhar) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.legendBar, { backgroundColor: colors.surface }]}
        contentContainerStyle={styles.legendScrollContent}
      >
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
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Bloqueado (Manutenção)</Text>
        </View>
      </ScrollView>
    </>
  );

  return (
    <View style={styles.container}>
      {renderFixedControls()}
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
        {headerComponent}
        {renderScrollControls()}

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
        ) : (
          visibleCourts.map((court) => (
            <CourtMatrixRow
              key={court.id}
              court={court}
              courtSlotsData={courtSlotsMap[court.id]}
              selectedDate={selectedDate}
              bookings={bookings.filter((b) => String(b.court_id) === String(court.id))}
              courtBlocks={courtBlocks.filter((cb) => String(cb.court_id) === String(court.id))}
              onSlotClick={(slotInfo) => {
                if (slotInfo.block) {
                  handleRemoveBlock(slotInfo.block);
                } else if (slotInfo.booking) {
                  const b = slotInfo.booking;
                  const client = b.customer_name || b.user?.name || 'Cliente';
                  const origin = b.is_manual ? 'Balcão / Presencial' : 'Aplicativo';
                  const startStr = extractTimeStr(b.start_time);
                  const endStr = extractTimeStr(b.end_time);
                  const confirmMsg = `Reserva: ${client}\nOrigem: ${origin}\nHorário: ${startStr} às ${endStr}\n\nDeseja cancelar esta reserva?`;

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
                  // Clicou em slot LIVRE -> Abre modal de agendamento presencial/balcão
                  onOpenManualModal?.({
                    courtId: court.id,
                    startTime: slotInfo.startTime,
                    endTime: slotInfo.endTime,
                    date: selectedDate,
                  });
                }
              }}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function isSameDate(dateTimeStr, targetDateStr) {
  if (!dateTimeStr || !targetDateStr) return false;
  const cleanStr = String(dateTimeStr).trim();
  const datePart = cleanStr.substring(0, 10);
  return datePart === targetDateStr;
}

function extractTimeStr(dateTimeStr) {
  if (!dateTimeStr) return '';
  const str = String(dateTimeStr).trim();
  if (str.includes('T')) {
    return str.split('T')[1]?.substring(0, 5) || '';
  }
  if (str.includes(' ')) {
    return str.split(' ')[1]?.substring(0, 5) || '';
  }
  return str.substring(0, 5);
}

/**
 * Componente que renderiza a matriz de horários verdadeiramente dinâmica para uma quadra.
 */
function CourtMatrixRow({ court, courtSlotsData, selectedDate, bookings, courtBlocks = [], onSlotClick }) {
  const { colors } = useTheme();

  const slots = courtSlotsData?.slots || [];
  const isOperating = courtSlotsData?.operating !== false;

  let freeCount = 0;
  let bookedCount = 0;
  let blockedCount = 0;

  slots.forEach((slot) => {
    const slotStartStr = extractTimeStr(slot.start_time);
    const isBlocked = slot.blocked || courtBlocks.some((cb) => isSameDate(cb.start_time, selectedDate) && extractTimeStr(cb.start_time) === slotStartStr);
    const b = bookings.find((bk) => isSameDate(bk.start_time, selectedDate) && extractTimeStr(bk.start_time) === slotStartStr);

    if (isBlocked) {
      blockedCount++;
    } else if (b && b.status !== 'cancelled') {
      bookedCount++;
    } else {
      freeCount++;
    }
  });

  return (
    <View style={[styles.matrixCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.matrixCardHeader, { borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.matrixCourtName, { color: colors.text }]}>{court.name}</Text>
          {isOperating && slots.length > 0 ? (
            <Text style={[styles.matrixCourtStats, { color: colors.textMuted }]}>
              {freeCount} livres • {bookedCount} ocupados {blockedCount > 0 ? `• ${blockedCount} bloqueados` : ''}
            </Text>
          ) : (
            <Text style={[styles.matrixCourtStats, { color: colors.error }]}>
              Sem turnos de funcionamento para este dia (Quadra Fechada)
            </Text>
          )}
        </View>
      </View>

      {!isOperating || slots.length === 0 ? (
        <View style={styles.closedCourtContainer}>
          <Clock size={20} color={colors.textMuted} style={{ marginBottom: 6 }} />
          <Text style={[styles.closedCourtText, { color: colors.textMuted }]}>
            Nenhum turno de funcionamento configurado para este dia da semana.
          </Text>
        </View>
      ) : (
        <View style={styles.gridWrapContainer}>
          {slots.map((slot) => {
            const slotStartStr = extractTimeStr(slot.start_time);
            const slotEndStr = extractTimeStr(slot.end_time);
            const displayTime = slot.formatted_time || `${slotStartStr} - ${slotEndStr}`;

            const matchingBlock = courtBlocks.find((cb) => isSameDate(cb.start_time, selectedDate) && extractTimeStr(cb.start_time) === slotStartStr);
            const matchingBooking = bookings.find((b) => isSameDate(b.start_time, selectedDate) && extractTimeStr(b.start_time) === slotStartStr);

            let status = 'free';
            if (matchingBlock || slot.blocked) {
              status = 'blocked';
            } else if (matchingBooking) {
              if (matchingBooking.status === 'cancelled') {
                status = 'cancelled';
              } else if (matchingBooking.is_manual) {
                status = 'booked_manual';
              } else {
                status = 'booked_app';
              }
            }

            // Determina o preço específico deste horário (slot)
            const slotPrice = slot.price !== undefined && slot.price !== null
              ? slot.price
              : court.hourly_rate
              ? parseFloat(court.hourly_rate)
              : 150;
            const formattedPrice = `R$ ${Math.round(slotPrice)}`;

            return (
              <TouchableOpacity
                key={slot.start_time || displayTime}
                activeOpacity={0.7}
                onPress={() =>
                  onSlotClick({
                    startTime: slotStartStr,
                    endTime: slotEndStr,
                    booking: matchingBooking,
                    block: matchingBlock,
                    slot: slot,
                  })
                }
                style={[
                  styles.matrixSlotTile,
                  status === 'free' && { backgroundColor: '#10B98112', borderColor: '#10B98150' },
                  status === 'booked_manual' && { backgroundColor: '#8B5CF620', borderColor: '#8B5CF6' },
                  status === 'booked_app' && { backgroundColor: '#3B82F620', borderColor: '#3B82F6' },
                  status === 'cancelled' && { backgroundColor: colors.error + '15', borderColor: colors.error + '40' },
                  status === 'blocked' && { backgroundColor: colors.error + '25', borderColor: colors.error },
                ]}
              >
                {/* Linha Superior: Horário + Preço Dinâmico do Slot */}
                <View style={styles.tileHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Clock size={11} color={colors.textMuted} style={{ marginRight: 3 }} />
                    <Text style={[styles.slotTimeText, { color: colors.text }]}>{displayTime}</Text>
                  </View>

                  <View
                    style={[
                      styles.slotPricePill,
                      {
                        backgroundColor:
                          status === 'free'
                            ? '#10B98120'
                            : status === 'blocked'
                            ? colors.error + '20'
                            : colors.primary + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotPricePillText,
                        {
                          color:
                            status === 'free'
                              ? '#059669'
                              : status === 'blocked'
                              ? colors.error
                              : colors.primary,
                        },
                      ]}
                    >
                      {formattedPrice}
                    </Text>
                  </View>
                </View>

                {/* Conteúdo / Status do Horário */}
                {status === 'blocked' ? (
                  <View style={styles.slotBookedContent}>
                    <ShieldAlert size={13} color={colors.error} />
                    <Text numberOfLines={1} style={[styles.slotClientText, { color: colors.error }]}>
                      {slot.block_reason || matchingBlock?.reason || 'Bloqueado'}
                    </Text>
                  </View>
                ) : status === 'free' ? (
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
      )}
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
        <View style={[styles.timeBadge, { backgroundColor: colors.primary + '18' }]}>
          <Clock size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.timeBadgeText, { color: colors.primary }]}>
            {startTimeStr} - {endTimeStr}
          </Text>
        </View>

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
  fixedControls: {
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
  },
  datesScrollContent: {
    flexDirection: 'row',
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
  courtFilterScrollContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    gap: 8,
    paddingTop: theme.spacing.xs,
    paddingBottom: 4,
  },
  courtFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
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
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  metricsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    gap: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  blockBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  blockBtnHeaderText: {
    fontSize: 12,
    fontWeight: '800',
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
    flexGrow: 0,
    borderBottomWidth: 1,
  },
  legendScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
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
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: 12,
    fontSize: theme.typography.sizes.body2,
  },
  errorText: {
    marginTop: 12,
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
    textAlign: 'center',
  },
  gridScrollContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  matrixCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
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
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  matrixCourtPrice: {
    fontSize: theme.typography.sizes.body1,
    fontWeight: '800',
  },
  closedCourtContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedCourtText: {
    fontSize: theme.typography.sizes.caption,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  gridWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: theme.spacing.md,
  },
  matrixSlotTile: {
    width: '48%',
    minWidth: 140,
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  tileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  slotTimeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  slotPricePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.xs || 4,
  },
  slotPricePillText: {
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
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  listPadding: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  cardContainer: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    gap: 6,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  originBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  originBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardBody: {
    gap: 6,
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
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
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
