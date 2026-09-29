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
  Repeat,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { getUserBookings, cancelBooking } from '../../api/bookings';
import {
  getTodayStrInSaoPaulo,
  parseDateTimeMs,
  isSameDateStr as isSameDate,
  extractTimeStr,
  intervalsOverlap,
  findOverlappingBooking,
} from '../../utils/datetime';
import { getCourtBlocks, deleteCourtBlock } from '../../api/courtBlocks';
import { getAvailableSlots } from '../../api/slots';
import {
  getFixedSchedule,
  extractApiError,
} from '../../api/fixedSchedules';
import { FixedScheduleModal } from './FixedScheduleModal';
import { FixedSchedulesListModal } from './FixedSchedulesListModal';
import { FixedDayModal } from './FixedDayModal';
import { EmptyState } from '../common/EmptyState';
import { ManagerMetricsCards } from './ManagerMetricsCards';
import { ScrollableRow } from '../common/ScrollableRow';

export function ManagerScheduleView({ courts = [], onOpenManualModal, onOpenBlockModal, refreshKey, headerComponent }) {
  const { colors } = useTheme();

  const getTodayStr = () => getTodayStrInSaoPaulo();

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [selectedCourtId, setSelectedCourtId] = useState('ALL'); // 'ALL' or courtId

  const [bookings, setBookings] = useState([]);
  const [courtBlocks, setCourtBlocks] = useState([]);
  const [courtSlotsMap, setCourtSlotsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Horários fixos (séries semanais)
  const [isFixedListOpen, setIsFixedListOpen] = useState(false);
  const [isFixedFormOpen, setIsFixedFormOpen] = useState(false);
  const [editingFixed, setEditingFixed] = useState(null);
  const [dayCtx, setDayCtx] = useState(null); // { fixed, date, initialBooking }

  // Lista de quadras ativas
  const activeCourtsList = courts.length > 0 ? courts : [
    { id: 1, name: 'Quadra Society 1 - Grama FIFA 50mm', hourly_rate: 150 },
    { id: 2, name: 'Quadra Society 2 - Coberta VIP', hourly_rate: 180 },
  ];

  // Gera lista de datas para atalhos rápidos (Próximos 7 dias, base hoje em SP)
  const generateDateChips = () => {
    const dates = [];
    const WEEKDAYS_PT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const [baseY, baseM, baseD] = getTodayStrInSaoPaulo().split('-').map(Number);
    const base = new Date(Date.UTC(baseY, baseM - 1, baseD, 12));
    for (let i = 0; i < 7; i++) {
      const d = new Date(base.getTime());
      d.setUTCDate(base.getUTCDate() + i);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayLabel = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : WEEKDAYS_PT[d.getUTCDay()];
      const dayNum = d.getUTCDate();
      const monthStr = MONTHS_PT[d.getUTCMonth()];
      dates.push({ dateStr, dayLabel, dayNum, monthStr });
    }
    return dates;
  };

  const dateChips = generateDateChips();

  const fetchScheduleData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);

    try {
      const [bookingsRes, blocksRes, indefiniteRes] = await Promise.all([
        getUserBookings({ date: selectedDate }),
        getCourtBlocks({ date: selectedDate }),
        // Garante que bloqueios por tempo indeterminado apareçam mesmo
        // que o filtro por data não os retorne em algum edge case.
        getCourtBlocks({ indefinite_only: true }).catch(() => ({ data: [] })),
      ]);
      const list = bookingsRes?.data || (Array.isArray(bookingsRes) ? bookingsRes : []);
      const blocksList = blocksRes?.data || (Array.isArray(blocksRes) ? blocksRes : []);
      const indefiniteList = indefiniteRes?.data || (Array.isArray(indefiniteRes) ? indefiniteRes : []);
      // Merge dedup por id (data + indeterminados)
      const mergedMap = new Map();
      [...blocksList, ...indefiniteList].forEach((b) => {
        if (b && b.id != null) mergedMap.set(String(b.id), b);
      });
      const mergedBlocks = Array.from(mergedMap.values());
      setBookings(list);
      setCourtBlocks(mergedBlocks);

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

  const handleRemoveBlock = (block, slotInfo = null) => {
    // O slot pode carregar o id do bloqueio mesmo quando a lista courtBlocks
    // está desatualizada (backend passa block_id no available-slots).
    const resolvedId =
      block?.id ??
      block?.block_id ??
      block?.blockout_id ??
      block?.blockout?.id ??
      slotInfo?.slot?.block_id ??
      slotInfo?.slot?.blockout_id ??
      slotInfo?.slot?.blockout?.id ??
      slotInfo?.block_id ??
      null;

    if (resolvedId == null) {
      const msg =
        'Não foi possível identificar o bloqueio para remover. Atualize a agenda e tente novamente. Se o bloqueio abrange vários horários, ele será removido pelo horário inicial.';
      console.warn('handleRemoveBlock sem id:', block, slotInfo);
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Bloqueio não identificado', msg);
      }
      fetchScheduleData(true);
      return;
    }

    const resolvedBlock = { ...block, id: resolvedId };

    const doUnblock = async () => {
      try {
        await deleteCourtBlock(resolvedId);
        setCourtBlocks((prev) => prev.filter((b) => String(b.id) !== String(resolvedId)));
        fetchScheduleData(true);
      } catch (err) {
        console.error('Erro ao remover bloqueio:', err);
        const apiMsg =
          err.response?.data?.message ||
          (err.response?.status === 404
            ? 'Bloqueio não encontrado. Ele pode já ter sido removido — atualize a agenda.'
            : 'Não foi possível remover o bloqueio.');
        if (Platform.OS === 'web') {
          window.alert(apiMsg);
        } else {
          Alert.alert('Erro', apiMsg);
        }
      }
    };

    const isIndef = isIndefiniteBlock(resolvedBlock);
    const confirmMsg = isIndef
      ? `Esta quadra está BLOQUEADA POR TEMPO INDETERMINADO ("${resolvedBlock.reason || 'Sem motivo'}").\n\nDesbloquear agora? A quadra voltará a ficar disponível para agendamentos.`
      : `Remover o bloqueio "${resolvedBlock.reason || 'Manutenção'}" na quadra? O horário voltará a ficar disponível.`;

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        doUnblock();
      }
    } else {
      Alert.alert(isIndef ? 'Desbloquear Quadra (Indeterminado)' : 'Desbloquear Quadra', confirmMsg, [
        { text: 'Manter Bloqueado', style: 'cancel' },
        { text: 'Liberar Quadra', style: 'destructive', onPress: doUnblock },
      ]);
    }
  };

  const handleCancelBooking = (booking) => {
    const doCancel = async () => {
      try {
        await cancelBooking(booking.id);
        setBookings((prev) => prev.filter((b) => b.id !== booking.id));
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

  // Clique num slot de horário fixo: abre o gerenciamento do dia
  // (lançar com pagamento, desmarcar só o dia, excluir a série).
  const openFixedDay = async (fixedId, initialBooking = null) => {
    if (fixedId == null) return;
    try {
      const full = await getFixedSchedule(fixedId);
      if (!full) throw new Error('Série não encontrada.');
      setDayCtx({ fixed: full, date: selectedDate, initialBooking });
    } catch (err) {
      const msg = extractApiError(err, 'Não foi possível abrir o gerenciamento do dia.');
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Erro', msg);
    }
  };

  const handleFixedSlotClick = (slotInfo) => {
    const fixedId = slotInfo?.fixed?.id ?? slotInfo?.slot?.fixed_schedule_id ?? null;
    openFixedDay(fixedId);
  };

  // Agendamento vinculado a um fixo: gerencia o dia (pagamento/lançamento)
  // em vez do fluxo avulso de cancelar.
  const handleFixedBookingClick = (booking) => {
    const fixedId = booking?.court_fixed_schedule_id
      ?? booking?.fixed_schedule_id
      ?? booking?.fixedSchedule?.id
      ?? null;
    if (fixedId == null) return false;
    openFixedDay(fixedId, booking);
    return true;
  };

  // Controles FIXOS: seletor de datas e filtro por quadra ficam sempre visíveis,
  // fora da rolagem, para manter o contexto da agenda em telas pequenas.
  const renderFixedControls = () => (
    <View style={[styles.fixedControls, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      {/* Seletor de Datas (Chips Horizontais) */}
      <ScrollableRow
        edgeColor={colors.surface}
        contentContainerStyle={styles.datesScrollContent}
        accessibilityLabel="Seletor de datas. Arraste para o lado para ver mais dias"
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
              <Text style={[styles.dateChipDay, { color: isSelected ? colors.white : colors.textMuted }]}>
                {chip.dayLabel}
              </Text>
              <Text style={[styles.dateChipNum, { color: isSelected ? colors.white : colors.textPrimary }]}>
                {chip.dayNum} {chip.monthStr}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollableRow>

      {/* Filtro por Quadra */}
      {activeCourtsList.length > 0 ? (
        <ScrollableRow
          edgeColor={colors.surface}
          contentContainerStyle={styles.courtFilterScrollContainer}
          accessibilityLabel="Filtro por quadra. Arraste para o lado para ver mais quadras"
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
                { color: selectedCourtId === 'ALL' ? colors.white : colors.textPrimary },
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
                    { color: isSelected ? colors.white : colors.textPrimary },
                  ]}
                >
                  {court.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollableRow>
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
            <Plus size={14} color={colors.white} />
            <Text style={styles.primaryActionBtnText}>Novo Agendamento</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onOpenBlockModal}
            style={[styles.blockBtnHeader, { backgroundColor: colors.errorSurface, borderColor: colors.error }]}
          >
            <ShieldAlert size={14} color={colors.error} style={{ marginRight: 4 }} />
            <Text style={[styles.blockBtnHeaderText, { color: colors.error }]}>Bloquear Horários</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsFixedListOpen(true)}
            style={[styles.blockBtnHeader, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
          >
            <Repeat size={14} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.blockBtnHeaderText, { color: colors.primary }]}>Horários Fixos</Text>
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
            <Grid size={15} color={colors.white} />
            <Text style={[styles.toggleBtnText, { color: colors.white }]}>
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
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Livre (Clique p/ agendar)</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.holding }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Balcão / Presencial</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Via App</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Horário Fixo (toque p/ gerenciar o dia)</Text>
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
            <Text style={[styles.errorText, { color: colors.textPrimary }]}>{error}</Text>
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
              onUnblock={handleRemoveBlock}
              onSlotClick={(slotInfo) => {
                if (slotInfo.block) {
                  handleRemoveBlock(slotInfo.block, slotInfo);
                } else if (slotInfo.fixed) {
                  handleFixedSlotClick(slotInfo);
                } else if (slotInfo.booking) {
                  const b = slotInfo.booking;
                  // Dia de fixo já lançado: abre o gerenciamento do dia
                  // (pagamento, cancelar lançamento, desmarcar) em vez do
                  // cancelar avulso — mantém o vínculo com a série.
                  if (handleFixedBookingClick(b)) return;
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
                  // Clicou em slot LIVRE -> Abre modal de agendamento presencial/balcão.
                  // Envia o contexto de ocupação para validação local de sobreposição,
                  // permitindo durações diferentes do intervalo de exibição (ex: 1h30
                  // numa grade de 60min) sem duplo-booking.
                  onOpenManualModal?.({
                    courtId: court.id,
                    startTime: slotInfo.startTime,
                    endTime: slotInfo.endTime,
                    date: selectedDate,
                    existingBookings: bookings.filter((b) => String(b.court_id) === String(court.id)),
                    existingBlocks: courtBlocks.filter((cb) => String(cb.court_id) === String(court.id)),
                  });
                }
              }}
            />
          ))
        )}
      </ScrollView>

      {/* Gestão de horários fixos (séries semanais) */}
      <FixedSchedulesListModal
        visible={isFixedListOpen}
        courts={activeCourtsList}
        onClose={() => setIsFixedListOpen(false)}
        onOpenCreate={() => {
          setEditingFixed(null);
          setIsFixedFormOpen(true);
        }}
        onOpenEdit={(fixed) => {
          setEditingFixed(fixed);
          setIsFixedFormOpen(true);
        }}
        onChanged={() => fetchScheduleData(true)}
      />
      <FixedScheduleModal
        visible={isFixedFormOpen}
        courts={activeCourtsList}
        fixedSchedule={editingFixed}
        initialCourtId={selectedCourtId !== 'ALL' ? selectedCourtId : null}
        onClose={() => {
          setIsFixedFormOpen(false);
          setEditingFixed(null);
        }}
        onSuccess={() => {
          setIsFixedListOpen(false);
          fetchScheduleData(true);
        }}
      />
      <FixedDayModal
        visible={Boolean(dayCtx)}
        courts={activeCourtsList}
        fixed={dayCtx?.fixed || null}
        date={dayCtx?.date || null}
        initialBooking={dayCtx?.initialBooking || null}
        onClose={() => setDayCtx(null)}
        onChanged={() => fetchScheduleData(true)}
        onOpenEdit={(fixed) => {
          setDayCtx(null);
          setEditingFixed(fixed);
          setIsFixedFormOpen(true);
        }}
      />
    </View>
  );
}

function isIndefiniteBlock(block) {
  if (!block) return false;
  return Boolean(block.is_indefinite) || block.end_time == null;
}

/**
 * Encontra o bloqueio que atinge um slot.
 * Suporta bloqueio de intervalo (ex: 13:00-21:00 cobrindo vários slots de 1h),
 * que antes só encontrava o slot inicial e causava DELETE sem id (Server Error).
 */
function findBlockForSlot(courtBlocks = [], slot, selectedDate) {
  if (!slot || !Array.isArray(courtBlocks) || courtBlocks.length === 0) return null;

  // Compat: backend pode enviar block_id direto no slot (available-slots).
  const slotBlockId =
    slot.block_id ?? slot.blockout_id ?? slot.blockout?.id ?? null;
  if (slotBlockId != null) {
    const byId = courtBlocks.find((b) => String(b?.id) === String(slotBlockId));
    if (byId) return byId;
  }

  const slotStartMs = parseDateTimeMs(slot.start_time);
  const slotEndMs = parseDateTimeMs(slot.end_time);

  if (Number.isNaN(slotStartMs) || Number.isNaN(slotEndMs)) {
    const slotStartStr = extractTimeStr(slot.start_time);
    return (
      courtBlocks.find(
        (cb) =>
          !isIndefiniteBlock(cb) &&
          isSameDate(cb.start_time, selectedDate) &&
          extractTimeStr(cb.start_time) === slotStartStr
      ) || null
    );
  }

  const overlapping = courtBlocks.filter((cb) => {
    if (!cb || isIndefiniteBlock(cb)) return false;
    const bS = parseDateTimeMs(cb.start_time);
    const bE = parseDateTimeMs(cb.end_time);
    if (Number.isNaN(bS) || Number.isNaN(bE)) {
      // Fallback: mesmo dia + mesmo início
      return (
        isSameDate(cb.start_time, selectedDate) &&
        extractTimeStr(cb.start_time) === extractTimeStr(slot.start_time)
      );
    }
    return intervalsOverlap(slotStartMs, slotEndMs, bS, bE);
  });

  if (overlapping.length === 0) return null;
  overlapping.sort((a, b) => parseDateTimeMs(a.start_time) - parseDateTimeMs(b.start_time));
  return overlapping[0];
}

/**
 * Componente que renderiza a matriz de horários verdadeiramente dinâmica para uma quadra.
 */
function CourtMatrixRow({ court, courtSlotsData, selectedDate, bookings, courtBlocks = [], onSlotClick, onUnblock }) {
  const { colors } = useTheme();

  const slots = courtSlotsData?.slots || [];
  const isOperating = courtSlotsData?.operating !== false;

  // Bloqueio por tempo indeterminado ativo para esta quadra:
  // - vem do backend via available-slots (blocked_indefinitely + blockout), ou
  // - vem da lista de blockouts (is_indefinite ou end_time null com início <= data selecionada).
  const indefiniteFromSlots = courtSlotsData?.blocked_indefinitely || courtSlotsData?.is_blocked_indefinitely
    ? (courtSlotsData?.blockout || { reason: courtSlotsData?.block_reason, is_indefinite: true })
    : null;
  const indefiniteFromList = courtBlocks.find((cb) => {
    if (!isIndefiniteBlock(cb)) return false;
    try {
      const startDate = String(cb.start_time).substring(0, 10);
      return startDate <= selectedDate;
    } catch {
      return true;
    }
  });
  const indefiniteBlock = indefiniteFromSlots?.reason || indefiniteFromSlots?.id
    ? { ...indefiniteFromSlots, court_id: court.id }
    : indefiniteFromList || null;
  const hasIndefinite = Boolean(
    indefiniteBlock || court?.is_blocked_indefinitely || court?.blocked_indefinitely
  );

  let freeCount = 0;
  let bookedCount = 0;
  let blockedCount = 0;
  let fixedCount = 0;

  slots.forEach((slot) => {
    const slotStartStr = extractTimeStr(slot.start_time);
    const overlappingBlock = findBlockForSlot(courtBlocks, slot, selectedDate);
    const isBlocked = hasIndefinite
      || slot.blocked
      || Boolean(overlappingBlock)
      || courtBlocks.some((cb) => {
        if (isIndefiniteBlock(cb)) {
          try {
            return String(cb.start_time).substring(0, 10) <= selectedDate;
          } catch {
            return true;
          }
        }
        // Mantido como fallback para formatos sem end_time parseável
        return isSameDate(cb.start_time, selectedDate) && extractTimeStr(cb.start_time) === slotStartStr;
      });
    // Desacoplamento exibição x duração: qualquer sobreposição [start,end)
    // ocupa o slot — ex: reserva 8:00-9:30 ocupa os slots 8:00 e 9:00.
    const b = findOverlappingBooking(bookings, slot, selectedDate);
    const isFixed = Boolean(slot.is_fixed);

    if (isBlocked) {
      blockedCount++;
    } else if (b && b.status !== 'cancelled') {
      bookedCount++;
    } else if (isFixed) {
      fixedCount++;
    } else {
      freeCount++;
    }
  });

  return (
    <View style={[styles.matrixCard, { backgroundColor: colors.surface, borderColor: hasIndefinite ? colors.error : colors.border }]}>
      <View style={[styles.matrixCardHeader, { borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.matrixCourtName, { color: colors.textPrimary }]}>{court.name}</Text>
          {hasIndefinite ? (
            <Text style={[styles.matrixCourtStats, { color: colors.error, fontWeight: '800' }]}>
              Bloqueada por tempo indeterminado{indefiniteBlock?.reason ? ` • ${indefiniteBlock.reason}` : ''}
            </Text>
          ) : isOperating && slots.length > 0 ? (
            <Text style={[styles.matrixCourtStats, { color: colors.textMuted }]}>
              {freeCount} livres • {bookedCount} ocupados{fixedCount > 0 ? ` • ${fixedCount} fixos` : ''} {blockedCount > 0 ? `• ${blockedCount} bloqueados` : ''}
            </Text>
          ) : (
            <Text style={[styles.matrixCourtStats, { color: colors.error }]}>
              Sem turnos de funcionamento para este dia (Quadra Fechada)
            </Text>
          )}
        </View>
      </View>

      {hasIndefinite ? (
        <View style={[styles.indefiniteBanner, { backgroundColor: colors.errorSurface, borderColor: colors.error }]}>
          <ShieldAlert size={16} color={colors.error} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.indefiniteBannerTitle, { color: colors.error }]}>
              Quadra indisponível até desbloqueio manual
            </Text>
            <Text style={[styles.indefiniteBannerText, { color: colors.textPrimary }]}>
              {indefiniteBlock?.reason || courtSlotsData?.block_reason || 'Sem motivo informado'}
              {indefiniteBlock?.start_time ? ` • desde ${String(indefiniteBlock.start_time).substring(0, 16).replace('T', ' ')}` : ''}
            </Text>
          </View>
          {indefiniteBlock?.id ? (
            <TouchableOpacity
              onPress={() => onUnblock?.(indefiniteBlock)}
              style={[styles.unblockBtn, { backgroundColor: colors.error }]}
              activeOpacity={0.8}
            >
              <Text style={styles.unblockBtnText}>Desbloquear</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {!isOperating || slots.length === 0 ? (
        hasIndefinite ? (
          <View style={styles.closedCourtContainer}>
            <Text style={[styles.closedCourtText, { color: colors.error }]}>
              Todos os horários estão bloqueados por tempo indeterminado. Toque em Desbloquear para liberar a quadra.
            </Text>
          </View>
        ) : (
          <View style={styles.closedCourtContainer}>
            <Clock size={20} color={colors.textMuted} style={{ marginBottom: 6 }} />
            <Text style={[styles.closedCourtText, { color: colors.textMuted }]}>
              Nenhum turno de funcionamento configurado para este dia da semana.
            </Text>
          </View>
        )
      ) : (
        <View style={styles.gridWrapContainer}>
          {slots.map((slot) => {
            const slotStartStr = extractTimeStr(slot.start_time);
            const slotEndStr = extractTimeStr(slot.end_time);
            const displayTime = slot.formatted_time || `${slotStartStr} - ${slotEndStr}`;

            const overlappingBlock = findBlockForSlot(courtBlocks, slot, selectedDate);
            const exactBlock =
              overlappingBlock ||
              courtBlocks.find((cb) => !isIndefiniteBlock(cb) && isSameDate(cb.start_time, selectedDate) && extractTimeStr(cb.start_time) === slotStartStr);
            // Se o slot vem bloqueado do backend mas não achamos o registro na lista,
            // monta fallback com block_id (quando disponível) para permitir o desbloqueio.
            const slotFallbackBlock = slot.blocked
              ? {
                  id: slot.block_id ?? slot.blockout_id ?? slot.blockout?.id ?? null,
                  reason: slot.block_reason,
                  court_id: court.id,
                }
              : null;
            const matchingBlock = hasIndefinite
              ? (indefiniteBlock || exactBlock)
              : (exactBlock || slotFallbackBlock);
            // Sobreposição em vez de igualdade de início: reserva 8:00-9:30
            // aparece ocupando tanto o tile 8:00 quanto o 9:00.
            const matchingBooking = findOverlappingBooking(bookings, slot, selectedDate);
            const matchingFixed = slot.is_fixed
              ? {
                  id: slot.fixed_schedule_id ?? null,
                  customer_name: slot.fixed_customer_name || 'Horário fixo',
                }
              : null;

            let status = 'free';
            if (hasIndefinite || matchingBlock || slot.blocked) {
              status = 'blocked';
            } else if (matchingBooking) {
              if (matchingBooking.is_manual) {
                status = 'booked_manual';
              } else {
                status = 'booked_app';
              }
            } else if (matchingFixed) {
              status = 'fixed';
            }

            // Determina o preço específico deste horário (slot)
            const slotPrice = slot.price !== undefined && slot.price !== null
              ? slot.price
              : court.hourly_rate
              ? parseFloat(court.hourly_rate)
              : 150;
            const formattedPrice = `R$ ${Math.round(slotPrice)}`;

            // Reserva pode ter duração diferente do intervalo de exibição
            // (ex: 8:00-9:30 numa grade de 60min). Exibe o intervalo real
            // quando ele não coincide com o slot, para o gestor entender
            // por que dois tiles aparecem ocupados.
            const bookingStartStr = matchingBooking ? extractTimeStr(matchingBooking.start_time) : null;
            const bookingEndStr = matchingBooking ? extractTimeStr(matchingBooking.end_time) : null;
            const bookingRange = bookingStartStr && bookingEndStr ? `${bookingStartStr}-${bookingEndStr}` : null;
            const isSpillover = Boolean(
              matchingBooking && bookingStartStr && bookingEndStr &&
              (bookingStartStr !== slotStartStr || bookingEndStr !== slotEndStr)
            );

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
                    fixed: matchingFixed,
                    slot: slot,
                  })
                }
                style={[
                  styles.matrixSlotTile,
                  status === 'free' && { backgroundColor: colors.successSurface, borderColor: colors.successSurface },
                  status === 'booked_manual' && { backgroundColor: colors.holdingSurface, borderColor: colors.holding },
                  status === 'booked_app' && { backgroundColor: colors.infoSurface, borderColor: colors.info },
                  status === 'fixed' && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                  status === 'cancelled' && { backgroundColor: colors.errorSurface, borderColor: colors.error },
                  status === 'blocked' && { backgroundColor: colors.errorSurface, borderColor: colors.error },
                ]}
              >
                {/* Linha Superior: Horário + Preço Dinâmico do Slot */}
                <View style={styles.tileHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Clock size={11} color={colors.textMuted} style={{ marginRight: 3 }} />
                    <Text style={[styles.slotTimeText, { color: colors.textPrimary }]}>{displayTime}</Text>
                  </View>

                  <View
                    style={[
                      styles.slotPricePill,
                      {
                        backgroundColor:
                          status === 'free'
                            ? colors.successSurface
                            : status === 'blocked'
                            ? colors.errorSurface
                            : colors.primaryLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotPricePillText,
                        {
                          color:
                            status === 'free'
                              ? colors.success
                              : status === 'blocked'
                              ? colors.error
                              : status === 'fixed'
                              ? colors.primary
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
                ) : status === 'fixed' ? (
                  <View style={styles.slotBookedContent}>
                    <Repeat size={13} color={colors.primary} />
                    <Text numberOfLines={1} style={[styles.slotClientText, { color: colors.primary }]}>
                      {(matchingFixed?.customer_name || 'Fixo').split(' ')[0]} • Fixo
                    </Text>
                  </View>
                ) : status === 'free' ? (
                  <View style={styles.slotFreeContent}>
                    <PlusCircle size={13} color={colors.success} />
                    <Text style={[styles.slotFreeText, { color: colors.success }]}>Livre</Text>
                  </View>
                ) : status === 'booked_manual' ? (
                  <View style={styles.slotBookedContent}>
                    <Store size={13} color={colors.holding} />
                    <Text numberOfLines={1} style={[styles.slotClientText, { color: colors.holding }]}>
                      {matchingBooking.customer_name?.split(' ')[0] || 'Balcão'}
                      {isSpillover && bookingRange ? ` • ${bookingRange}` : ''}
                    </Text>
                  </View>
                ) : status === 'booked_app' ? (
                  <View style={styles.slotBookedContent}>
                    <Smartphone size={13} color={colors.info} />
                    <Text numberOfLines={1} style={[styles.slotClientText, { color: colors.info }]}>
                      {(matchingBooking.customer_name || matchingBooking.user?.name)?.split(' ')[0] || 'App'}
                      {isSpillover && bookingRange ? ` • ${bookingRange}` : ''}
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
        <View style={[styles.timeBadge, { backgroundColor: colors.primaryLight }]}>
          <Clock size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.timeBadgeText, { color: colors.primary }]}>
            {startTimeStr} - {endTimeStr}
          </Text>
        </View>

        <View
          style={[
            styles.originBadge,
            { backgroundColor: isManual ? colors.holdingSurface : colors.successSurface },
          ]}
        >
          {isManual ? (
            <Store size={14} color={colors.holding} style={{ marginRight: 4 }} />
          ) : (
            <Smartphone size={14} color={colors.success} style={{ marginRight: 4 }} />
          )}
          <Text
            style={[
              styles.originBadgeText,
              { color: isManual ? colors.holding : colors.success },
            ]}
          >
            {isManual ? 'BALCÃO' : 'VIA APP'}
          </Text>
        </View>

        {isCancelled ? (
          <View style={[styles.statusBadge, { backgroundColor: colors.errorSurface }]}>
            <XCircle size={14} color={colors.error} style={{ marginRight: 4 }} />
            <Text style={[styles.statusBadgeText, { color: colors.error }]}>CANCELADO</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, { backgroundColor: colors.successSurface }]}>
            <CheckCircle size={14} color={colors.success} style={{ marginRight: 4 }} />
            <Text style={[styles.statusBadgeText, { color: colors.success }]}>CONFIRMADO</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.courtNameText, { color: colors.textPrimary }]}>
          {booking.court?.name || 'Quadra Esportiva'}
        </Text>

        <View style={styles.infoRow}>
          <User size={15} color={colors.textMuted} style={{ marginRight: 6 }} />
          <Text style={[styles.infoText, { color: colors.textPrimary }]}>{clientName}</Text>
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
          <Text style={[styles.priceText, { color: colors.textPrimary }]}>
            R$ {booking.total_price ? parseFloat(booking.total_price).toFixed(2) : '140.00'}
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onCancel(booking)}
            style={[styles.btnCancel, { backgroundColor: colors.errorSurface, borderColor: colors.error }]}
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
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateChipNum: {
    fontSize: theme.typography.sizes.label,
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
    fontSize: theme.typography.sizes.bodySmall,
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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.bodySmall,
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
    fontSize: theme.typography.sizes.bodySmall,
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
    fontSize: theme.typography.sizes.bodySmall,
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
    fontSize: theme.typography.sizes.bodySmall,
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
    fontSize: theme.typography.sizes.body,
  },
  errorText: {
    marginTop: 12,
    fontSize: theme.typography.sizes.body,
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
    fontSize: theme.typography.sizes.body,
    fontWeight: '800',
  },
  matrixCourtStats: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '600',
    marginTop: 2,
  },
  matrixCourtPrice: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '800',
  },
  indefiniteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 4,
  },
  indefiniteBannerTitle: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '800',
  },
  indefiniteBannerText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
    marginTop: 2,
  },
  unblockBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    marginLeft: 8,
  },
  unblockBtnText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.bodySmall,
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
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '800',
  },
  slotPricePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.xs || 4,
  },
  slotPricePillText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '800',
  },
  slotFreeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotFreeText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
  },
  slotBookedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotClientText: {
    fontSize: theme.typography.sizes.caption,
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
    fontSize: theme.typography.sizes.bodySmall,
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
    fontSize: theme.typography.sizes.caption,
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
    fontSize: theme.typography.sizes.caption,
    fontWeight: '800',
  },
  cardBody: {
    gap: 6,
  },
  courtNameText: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '800',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: theme.typography.sizes.body,
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
    fontSize: theme.typography.sizes.body,
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
});
