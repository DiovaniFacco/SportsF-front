import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  LogOut,
  User,
  Layers,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';
import { getUserBookings, cancelBooking } from '../api/bookings';
import { BottomNav } from '../components/common/BottomNav';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { FilterChip } from '../components/common/FilterChip';

export function MyBookingsScreen({ onTabChange, onGoToExplore, onOpenAuth }) {
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('Todos'); // 'Todos' | 'Próximos' | 'Confirmados' | 'Cancelados'
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!isRefresh) setLoading(true);
    setError(null);

    try {
      const response = await getUserBookings();
      // Tratar se a resposta for { data: [...] } ou array direto
      const list = Array.isArray(response) ? response : response.data || [];
      setBookings(list);
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
      setError('Não foi possível carregar seus agendamentos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings(true);
  };

  const handleCancelBooking = (bookingId) => {
    const confirmMessage = 'Tem certeza de que deseja cancelar este agendamento?';

    const doCancel = async () => {
      setCancellingId(bookingId);
      try {
        await cancelBooking(bookingId);
        if (Platform.OS === 'web') {
          window.alert('Seu agendamento foi cancelado com sucesso.');
        } else {
          Alert.alert('Sucesso', 'Seu agendamento foi cancelado.');
        }
        fetchBookings(true);
      } catch (err) {
        let apiMsg = err.response?.data?.message || err.message || 'Não foi possível cancelar o agendamento.';
        if (err.response?.data?.errors) {
          const firstError = Object.values(err.response.data.errors)[0];
          if (firstError && firstError.length > 0) {
            apiMsg = firstError[0];
          }
        }
        if (Platform.OS === 'web') {
          window.alert(apiMsg);
        } else {
          Alert.alert('Erro', apiMsg);
        }
      } finally {
        setCancellingId(null);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        doCancel();
      }
    } else {
      Alert.alert(
        'Cancelar Agendamento',
        confirmMessage,
        [
          { text: 'Voltar', style: 'cancel' },
          {
            text: 'Sim, Cancelar',
            style: 'destructive',
            onPress: doCancel,
          },
        ]
      );
    }
  };

  // Formatar data: "YYYY-MM-DD HH:mm:ss" ou ISO -> "Qui, 20/08/2026"
  const formatDateStr = (dateString) => {
    if (!dateString) return '';
    try {
      const cleanStr = dateString.replace(' ', 'T');
      const d = new Date(cleanStr);
      if (isNaN(d.getTime())) return dateString;

      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const dayName = days[d.getDay()];
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();

      return `${dayName}, ${day}/${month}/${year}`;
    } catch (e) {
      return dateString;
    }
  };

  // Formatar hora: "09:00 - 10:00"
  const formatTimeRange = (startStr, endStr) => {
    if (!startStr || !endStr) return '';
    try {
      const startTime = startStr.includes(' ') ? startStr.split(' ')[1] : startStr.split('T')[1];
      const endTime = endStr.includes(' ') ? endStr.split(' ')[1] : endStr.split('T')[1];
      const s = startTime ? startTime.substring(0, 5) : '';
      const e = endTime ? endTime.substring(0, 5) : '';
      return `${s} - ${e}`;
    } catch (e) {
      return '';
    }
  };

  // Filtragem da lista
  const now = new Date();
  const filteredBookings = bookings.filter((item) => {
    const isCancelled = item.status === 'cancelled';
    const startDate = item.start_time ? new Date(item.start_time.replace(' ', 'T')) : null;
    const isUpcoming = startDate && startDate > now && !isCancelled;

    if (selectedFilter === 'Próximos') return isUpcoming;
    if (selectedFilter === 'Confirmados') return item.status === 'confirmed';
    if (selectedFilter === 'Cancelados') return isCancelled;
    return true;
  });

  const renderStatusBadge = (status) => {
    if (status === 'confirmed') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: colors.primaryLight }]}>
          <CheckCircle2 size={13} color={colors.primary} />
          <Text style={[styles.statusBadgeText, { color: colors.primary }]}>Confirmado</Text>
        </View>
      );
    }
    if (status === 'cancelled') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#FEF2F2' }]}>
          <XCircle size={13} color={colors.error} />
          <Text style={[styles.statusBadgeText, { color: colors.error }]}>Cancelado</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
        <AlertCircle size={13} color={colors.warning} />
        <Text style={[styles.statusBadgeText, { color: colors.warning }]}>Pendente</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const isCancelled = item.status === 'cancelled';
    const startDate = item.start_time ? new Date(item.start_time.replace(' ', 'T')) : null;
    const isFuture = startDate && startDate > now;
    const canCancel = isFuture && !isCancelled;

    const courtName = item.court?.name || 'Quadra Esportiva';
    const venueName = item.court?.venue?.name || 'Complexo Esportivo';
    const dateFormatted = formatDateStr(item.start_time);
    const timeFormatted = formatTimeRange(item.start_time, item.end_time);
    const priceFormatted = item.total_price
      ? `R$ ${Number(item.total_price).toFixed(2).replace('.', ',')}`
      : 'R$ --';

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: isCancelled ? 0.75 : 1,
          },
        ]}
      >
        {/* Header do Card: Nome da Quadra e Status */}
        <View style={styles.cardHeader}>
          <View style={styles.titleCol}>
            <Text style={[styles.courtName, { color: colors.textPrimary }]} numberOfLines={1}>
              {courtName}
            </Text>
            <View style={styles.venueRow}>
              <MapPin size={12} color={colors.primary} />
              <Text style={[styles.venueName, { color: colors.textSecondary }]} numberOfLines={1}>
                {venueName}
              </Text>
            </View>
          </View>
          {renderStatusBadge(item.status)}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Detalhes de Data e Horário */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <View style={[styles.iconCircle, { backgroundColor: colors.backgroundSecondary }]}>
              <Calendar size={15} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Data</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{dateFormatted}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={[styles.iconCircle, { backgroundColor: colors.backgroundSecondary }]}>
              <Clock size={15} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Horário</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{timeFormatted}</Text>
            </View>
          </View>
        </View>

        {/* Footer do Card: Preço e Botão de Cancelar */}
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View style={styles.priceCol}>
            <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Valor total</Text>
            <Text style={[styles.priceValue, { color: colors.primary }]}>{priceFormatted}</Text>
          </View>

          {canCancel ? (
            <TouchableOpacity
              activeOpacity={0.75}
              style={[styles.cancelBtn, { borderColor: colors.error }]}
              onPress={() => handleCancelBooking(item.id)}
              disabled={cancellingId === item.id}
            >
              <Text style={[styles.cancelBtnText, { color: colors.error }]}>
                {cancellingId === item.id ? 'Cancelando...' : 'Cancelar'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <View style={styles.paddingContainer}>
          <View style={[styles.authCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.authIconCircle, { backgroundColor: colors.primaryLight }]}>
              <User size={32} color={colors.primary} />
            </View>
            <Text style={[styles.authTitle, { color: colors.textPrimary }]}>
              Entre na sua conta
            </Text>
            <Text style={[styles.authMessage, { color: colors.textSecondary }]}>
              Para visualizar seus agendamentos e historico de reservas, faça login ou crie sua conta na plataforma.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.authButton, { backgroundColor: colors.primary }]}
              onPress={onOpenAuth}
            >
              <Text style={styles.authButtonText}>Fazer Login / Cadastrar</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (loading && !refreshing) {
      return (
        <View style={styles.paddingContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.paddingContainer}>
          <ErrorState message={error} onRetry={() => fetchBookings()} />
        </View>
      );
    }

    if (filteredBookings.length === 0) {
      return (
        <View style={styles.paddingContainer}>
          <EmptyState
            title="Nenhum agendamento encontrado"
            message={
              selectedFilter === 'Todos'
                ? 'Você ainda não possui agendamentos marcados. Que tal encontrar uma quadra para praticar hoje?'
                : `Não encontramos agendamentos para a categoria "${selectedFilter}".`
            }
            onResetFilters={onGoToExplore}
            actionLabel="Explorar Quadras"
          />
        </View>
      );
    }

    return (
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.paddingContainer}
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
    );
  };

  const filterOptions = ['Todos', 'Próximos', 'Confirmados', 'Cancelados'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.mainWrapper}>
        {/* Screen Header */}
        <View style={[styles.headerContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerTitleRow}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Meus Agendamentos</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {isAuthenticated ? `Olá, ${user?.name?.split(' ')[0] || 'Atleta'}` : 'Gerencie suas reservas'}
              </Text>
            </View>
            <View style={[styles.headerBadge, { backgroundColor: colors.primaryLight }]}>
              <Calendar size={18} color={colors.primary} />
            </View>
          </View>

          {/* Filter Chips */}
          {isAuthenticated ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterScrollContent}
            >
              {filterOptions.map((opt) => (
                <FilterChip
                  key={opt}
                  label={opt}
                  isSelected={selectedFilter === opt}
                  onPress={() => setSelectedFilter(opt)}
                />
              ))}
            </ScrollView>
          ) : null}
        </View>

        {/* Content Body */}
        <View style={styles.body}>{renderContent()}</View>
      </View>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab="agendamentos" onTabChange={onTabChange} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 1024,
    alignSelf: 'center',
  },
  headerContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h2,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.bodySmall,
    marginTop: 2,
  },
  headerBadge: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScroll: {
    marginVertical: 4,
  },
  filterScrollContent: {
    gap: 8,
    paddingRight: theme.spacing.md,
    paddingVertical: 4,
  },
  body: {
    flex: 1,
    width: '100%',
  },
  paddingContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleCol: {
    flex: 1,
  },
  courtName: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '800',
    marginBottom: 4,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venueName: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: theme.spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '700',
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
  },
  priceCol: {
    justifyContent: 'center',
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '800',
  },
  cancelBtn: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  authCard: {
    padding: theme.spacing.xl,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  authIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  authTitle: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  authMessage: {
    fontSize: theme.typography.sizes.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    gap: 8,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: theme.typography.sizes.button,
  },
});
