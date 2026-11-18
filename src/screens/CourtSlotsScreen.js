import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import {
  ArrowLeft,
  Sunrise,
  Sun,
  Moon,
  ShieldCheck,
  Layers,
  Calendar,
  MessageCircle,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';
import { getAvailableSlots } from '../api/slots';
import { createBooking, createBookingsBatch } from '../api/bookings';
import { DateSelector } from '../components/slots/DateSelector';
import { SlotLegend } from '../components/slots/SlotLegend';
import { SlotCard } from '../components/slots/SlotCard';
import { SelectionFooter } from '../components/slots/SelectionFooter';
import { BookingConfirmationModal } from '../components/slots/BookingConfirmationModal';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { BottomNav } from '../components/common/BottomNav';
import { optimizeImageUrl } from '../utils/imageUtils';
import { isSimplifiedVenue, openWhatsappBooking } from '../utils/whatsapp';
import { getTodayStrInSaoPaulo, parseServerDateTime } from '../utils/datetime';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOMER_NAME_KEY = '@sf_customer_name';

export function CourtSlotsScreen({ court, venue, onBack, onOpenAuth, onTabChange, hideBottomNav = false, onDateSync, initialDate = null }) {
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();

  // Modo Simplificado: agenda apenas visual, Agendar abre o WhatsApp (sem criar reserva).
  const isSimplified = isSimplifiedVenue(venue);
  const [whatsappError, setWhatsappError] = useState(null);
  // Nome do cliente para a mensagem do WhatsApp (lembrado no aparelho).
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    // Nome lembrado no aparelho: pré-preenche o campo do pedido no WhatsApp.
    AsyncStorage.getItem(CUSTOMER_NAME_KEY)
      .then((v) => v && setCustomerName(v))
      .catch(() => {});
  }, []);

  const handleChangeName = (value) => {
    setCustomerName(value);
    AsyncStorage.setItem(CUSTOMER_NAME_KEY, value).catch(() => {});
  };

  const getTodayStr = () => getTodayStrInSaoPaulo();

  const [selectedDate, setSelectedDate] = useState(initialDate || getTodayStr());
  const [slotsData, setSlotsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  // "Carrinho" multi-dia: cada slot carrega bookingDate, permitindo
  // selecionar horários em dias diferentes sem perder a seleção.
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [activeTab, setActiveTab] = useState('explorar');

  // Booking Modal States
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [successBooking, setSuccessBooking] = useState(null);

  const fetchSlots = useCallback(async (isRefresh = false) => {
    if (!court) return;
    if (!isRefresh) setLoading(true);
    setError(null);

    try {
      const data = await getAvailableSlots(court.id, selectedDate);
      setSlotsData(data);
    } catch (err) {
      console.error('Erro ao carregar horários:', err);
      setError('Não foi possível carregar a grade de horários.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [court, selectedDate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots, selectedDate]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSlots(true);
  };

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    // Sincroniza a data na URL (replaceState: não empilha histórico).
    if (onDateSync) onDateSync(date);
  };

  const handleToggleSelectSlot = (slot) => {
    if (!slot.available) return;

    setSelectedSlots((prev) => {
      const exists = prev.some(
        (s) => s.start_time === slot.start_time && (s.bookingDate || selectedDate) === (slot.bookingDate || selectedDate)
      );
      if (exists) {
        return prev.filter(
          (s) => !(s.start_time === slot.start_time && (s.bookingDate || selectedDate) === (slot.bookingDate || selectedDate))
        );
      }
      return [...prev, { ...slot, bookingDate: selectedDate }];
    });
  };

  const handleOpenConfirmModal = async () => {
    // MODO SIMPLIFICADO: não cria reserva — abre o WhatsApp com mensagem pré-preenchida.
    if (isSimplified) {
      setWhatsappError(null);
      // Agrupa os horários selecionados por dia: [{ date, times }]
      const byDate = new Map();
      selectedSlots.forEach((s) => {
        const d = s.bookingDate || selectedDate;
        if (!byDate.has(d)) byDate.set(d, []);
        byDate.get(d).push(s.formatted_time);
      });
      const days = Array.from(byDate.entries()).map(([date, times]) => ({ date, times }));
      const totalPrice = selectedSlots.reduce((acc, s) => acc + (s.price || 0), 0);
      const result = await openWhatsappBooking({
        venue,
        courtName: court?.name,
        days,
        customerName: customerName.trim() || (user?.name ?? ''),
        totalPrice: totalPrice > 0 ? totalPrice : null,
      });
      if (!result.success && result.error === 'no-number') {
        setWhatsappError('Este complexo ainda não configurou um WhatsApp para agendamentos. Entre em contato diretamente pelo telefone do complexo.');
      }
      return;
    }

    setModalError(null);
    setSuccessBooking(null);
    if (!isAuthenticated) {
      if (onOpenAuth) {
        onOpenAuth();
      } else {
        setModalError('Você precisa estar conectado para realizar um agendamento. Por favor, faça login.');
        setIsModalVisible(true);
      }
      return;
    }
    setIsModalVisible(true);
  };

  const handleConfirmBooking = async ({ notes }) => {
    if (!isAuthenticated) {
      setModalError('Você precisa estar conectado para realizar um agendamento.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      let lastBooking = null;
      // Agrupa a seleção por dia (carrinho multi-dia) e usa o endpoint em lote
      // por data (atômico: tudo ou nada). Evita "sucesso parcial" quando um
      // dos horários falha.
      const byDate = new Map();
      selectedSlots.forEach((slot) => {
        const d = slot.bookingDate || selectedDate;
        if (!byDate.has(d)) byDate.set(d, []);
        byDate.get(d).push(slot);
      });

      for (const [, daySlots] of byDate) {
        if (daySlots.length > 1) {
          const res = await createBookingsBatch({
            courtId: court.id,
            slots: daySlots.map((slot) => ({
              startTime: slot.start_time,
              endTime: slot.end_time,
            })),
            notes,
          });
          const created = res.bookings || (res.booking ? [res.booking] : []);
          lastBooking = created[created.length - 1] || lastBooking;
        } else {
          for (const slot of daySlots) {
            const res = await createBooking({
              courtId: court.id,
              startTime: slot.start_time,
              endTime: slot.end_time,
              notes,
            });
            lastBooking = res.booking;
          }
        }
      }

      setSuccessBooking(lastBooking || { success: true });

      // Auto-refresh the slots from the backend to mark booked slots as unavailable
      await fetchSlots(true);
    } catch (err) {
      console.error('Erro ao confirmar agendamento:', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.errors?.start_time?.[0] ||
        err.response?.data?.errors?.user?.[0] ||
        'Não foi possível concluir o agendamento. Este horário pode ter sido reservado por outro cliente.';
      setModalError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishSuccess = () => {
    setIsModalVisible(false);
    setSelectedSlots([]);
    setSuccessBooking(null);
    setModalError(null);
  };

  if (!court) return null;

  const now = new Date();
  const slotsList = (slotsData?.slots || []).filter((s) => {
    if (!s.start_time) return true;
    // Compara o instante absoluto (horário de SP do servidor) com agora.
    const slotDate = parseServerDateTime(s.start_time);
    return slotDate ? slotDate > now : true;
  });

  // Agrupar horários por período
  const morningSlots = slotsList.filter((s) => {
    const hour = parseInt(s.formatted_time.split(':')[0], 10);
    return hour >= 6 && hour < 12;
  });

  const afternoonSlots = slotsList.filter((s) => {
    const hour = parseInt(s.formatted_time.split(':')[0], 10);
    return hour >= 12 && hour < 18;
  });

  const eveningSlots = slotsList.filter((s) => {
    const hour = parseInt(s.formatted_time.split(':')[0], 10);
    return hour >= 18 && hour <= 23;
  });

  const renderPeriodSection = (title, slots, IconComponent, iconColor) => {
    if (slots.length === 0) return null;
    const availableCount = slots.filter((s) => s.available).length;

    return (
      <View key={title} style={styles.periodContainer}>
        {/* Period Header */}
        <View style={styles.periodHeader}>
          <View style={styles.periodTitleRow}>
            <View style={[styles.periodIconBadge, { backgroundColor: colors.backgroundSecondary }]}>
              <IconComponent size={15} color={iconColor} />
            </View>
            <Text style={[styles.periodTitle, { color: colors.textPrimary }]}>{title}</Text>
          </View>

          <Text style={[styles.periodCountText, { color: colors.textMuted }]}>
            {availableCount} {availableCount === 1 ? 'disponível' : 'disponíveis'}
          </Text>
        </View>

        {/* Grid of Slots */}
        <View style={styles.slotsGrid}>
          {slots.map((slot) => {
            const isSelected = selectedSlots.some(
              (s) => s.start_time === slot.start_time && (s.bookingDate || selectedDate) === selectedDate
            );
            return (
              <SlotCard
                key={slot.start_time}
                slot={slot}
                isSelected={isSelected}
                onToggleSelect={handleToggleSelectSlot}
              />
            );
          })}
        </View>
      </View>
    );
  };

  const renderCourtHeader = () => (
    <>
      {/* Court Summary Card */}
      <View style={[styles.courtInfoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.courtInfoRow}>
          {court.image_url ? (
            <Image source={{ uri: optimizeImageUrl(court.image_url, { width: 1400, quality: 90 }) }} style={styles.courtThumb} />
          ) : null}

          <View style={styles.courtDetailsCol}>
            <Text style={[styles.courtNameText, { color: colors.textPrimary }]} numberOfLines={1}>
              {court.name}
            </Text>

            {venue?.name ? (
              <Text style={[styles.venueNameText, { color: colors.primary }]} numberOfLines={1}>
                {venue.name}
              </Text>
            ) : null}

            {court.surface ? (
              <View style={styles.pillsRow}>
                <View style={[styles.miniPill, { backgroundColor: colors.backgroundSecondary }]}>
                  <Layers size={11} color={colors.textMuted} />
                  <Text style={[styles.miniPillText, { color: colors.textSecondary }]}>{court.surface}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Date Selector — sempre visível para permitir navegar entre dias */}
      <DateSelector
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
      />
    </>
  );

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.paddingContainer}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.paddingContainer}>
          <ErrorState message={error} onRetry={() => fetchSlots()} />
        </View>
      );
    }

    const isBlockedIndefinitely = Boolean(
      slotsData?.blocked_indefinitely || slotsData?.is_blocked_indefinitely
    );

    if (isBlockedIndefinitely) {
      return (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {renderCourtHeader()}
          <View style={styles.paddingContainer}>
            <View style={[styles.blockedCard, { backgroundColor: colors.errorSurface, borderColor: colors.error }]}>
              <Text style={[styles.blockedTitle, { color: colors.error }]}>
                Quadra temporariamente indisponível
              </Text>
              <Text style={[styles.blockedText, { color: colors.textSecondary }]}>
                {slotsData?.message ||
                  `Esta quadra está indisponível por tempo indeterminado${slotsData?.block_reason ? ` (${slotsData.block_reason})` : ''}. Tente outra quadra ou data.`}
              </Text>
            </View>
          </View>
        </ScrollView>
      );
    }

    if (!slotsData || (slotsData?.slots || []).length === 0) {
      // Mensagem precisa conforme o motivo real (B16): data passada,
      // quadra sem grade no dia, ou grade de hoje já esgotada.
      const isPast = Boolean(slotsData?.is_past);
      const noGrade = Boolean(slotsData) && slotsData.operating === false;
      const title = isPast ? 'Data no passado' : noGrade ? 'Sem grade neste dia' : 'Nenhum horário disponível';
      const message =
        (isPast && (slotsData?.message || 'Esta data já passou. Selecione hoje ou uma data futura.')) ||
        (noGrade && 'Esta quadra não possui grade de horários cadastrada para a data selecionada.') ||
        (slotsData?.message && slotsData.slots?.length === 0 ? slotsData.message : null) ||
        'Todos os horários desta data já passaram ou foram ocupados. Tente outra data.';
      return (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {renderCourtHeader()}
          <View style={styles.paddingContainer}>
            <EmptyState
              title={title}
              message={`${message} Selecione outro dia acima para ver a disponibilidade.`}
              onResetFilters={() => fetchSlots()}
            />
          </View>
        </ScrollView>
      );
    }

    if (slotsList.length === 0) {
      // Grade existe, mas nada futuro a exibir (ex.: resto do dia esgotado).
      return (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {renderCourtHeader()}
          <View style={styles.paddingContainer}>
            <EmptyState
              title="Horários esgotados"
              message="Todos os horários desta data já passaram ou foram ocupados. Selecione outro dia acima para ver a disponibilidade."
              onResetFilters={() => fetchSlots()}
            />
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {renderCourtHeader()}

        {whatsappError ? (
          <View style={[styles.simplifiedBanner, { backgroundColor: colors.errorSurface, borderColor: colors.error }]}>
            <Text style={{ color: colors.error, fontSize: theme.typography.sizes.bodySmall, fontWeight: '700' }}>{whatsappError}</Text>
          </View>
        ) : null}

        {/* Status Legend */}
        <SlotLegend />

        {/* Period Sections — rótulos sem intervalo (não batem com os slots)
            e ícone distinto por período (nascer do sol / sol / lua). */}
        {renderPeriodSection('Manhã', morningSlots, Sunrise, colors.gold)}
        {renderPeriodSection('Tarde', afternoonSlots, Sun, colors.warning)}
        {renderPeriodSection('Noite', eveningSlots, Moon, colors.info)}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Top Header Bar */}
      <View style={[styles.topHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          style={[styles.backBtn, { backgroundColor: colors.backgroundSecondary }]}
        >
          <ArrowLeft size={18} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            Horários Disponíveis
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {court.name}
          </Text>
        </View>
      </View>

      {/* Screen Body */}
      <View style={styles.body}>{renderContent()}</View>

      {/* Bottom Sticky Selection Summary Bar (if slots selected) */}
      <SelectionFooter
        selectedSlots={selectedSlots}
        selectedDate={selectedDate}
        courtName={court.name}
        confirmLabel={isSimplified ? 'Enviar pedido no WhatsApp' : 'Agendar'}
        confirmIcon={isSimplified ? MessageCircle : null}
        showNameField={isSimplified}
        nameValue={customerName}
        onNameChange={handleChangeName}
        onClearSelection={() => setSelectedSlots([])}
        onConfirmSelection={handleOpenConfirmModal}
      />

      {/* Booking Confirmation Modal (modo completo apenas — simplificado usa WhatsApp) */}
      {!isSimplified ? (
        <BookingConfirmationModal
          visible={isModalVisible}
          onClose={() => {
            setIsModalVisible(false);
            setModalError(null);
          }}
          selectedSlots={selectedSlots}
          selectedDate={selectedDate}
          court={court}
          venue={venue}
          user={user}
          onConfirmBooking={handleConfirmBooking}
          isSubmitting={isSubmitting}
          error={modalError}
          successBooking={successBooking}
          onFinishSuccess={handleFinishSuccess}
        />
      ) : null}

      {/* Mobile Bottom Navigation (oculta no modo Simplificado com link exclusivo) */}
      {selectedSlots.length === 0 && !hideBottomNav && !isSimplified ? (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab === 'explorar') {
              onBack();
            } else if (onTabChange) {
              onTabChange(tab);
            } else {
              setActiveTab(tab);
            }
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  paddingContainer: {
    padding: theme.spacing.md,
  },
  courtInfoCard: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  courtInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  courtThumb: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.sm,
  },
  courtDetailsCol: {
    flex: 1,
  },
  courtNameText: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '800',
    marginBottom: 2,
  },
  venueNameText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '700',
    marginBottom: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  miniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
    gap: 4,
  },
  miniPillText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
  periodContainer: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  periodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodIconBadge: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTitle: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '800',
  },
  periodCountText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '600',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  simplifiedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  blockedCard: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 8,
  },
  blockedTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  blockedText: {
    fontSize: theme.typography.sizes.label,
    lineHeight: 18,
  },
});
