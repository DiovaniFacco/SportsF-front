import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  DollarSign,
  TrendingUp,
  Users,
  Store,
  Smartphone,
  Layers,
  Calendar,
  BarChart3,
  Award,
  Clock,
  CheckCircle2,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { getUserBookings } from '../../api/bookings';
import { ScrollableRow } from '../common/ScrollableRow';

export function ManagerMetricsView({ courts = [], headerComponent }) {
  const { colors } = useTheme();

  const [period, setPeriod] = useState('today'); // 'today' | 'week' | 'month'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetricsData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      // Busca reservas
      const res = await getUserBookings();
      const list = res?.data || (Array.isArray(res) ? res : []);
      setBookings(list);
    } catch (err) {
      console.error('Erro ao carregar reservas para métricas:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMetricsData();
  }, [fetchMetricsData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetricsData(true);
  };

  // Filtragem e cálculos baseados no período selecionado
  const activeBookings = bookings.filter((b) => b.status !== 'cancelled');

  const totalCourts = courts.length;
  const avgHourlyRate = totalCourts > 0
    ? (courts.reduce((acc, c) => acc + (parseFloat(c.hourly_rate) || 0), 0) / totalCourts)
    : 0;

  // Faturamento Total Estimado
  const totalRevenue = activeBookings.reduce((sum, b) => {
    const val = parseFloat(b.total_price || 140);
    return sum + (isNaN(val) ? 140 : val);
  }, 0);

  // Divisão Balcão vs App
  const manualBookings = activeBookings.filter((b) => b.is_manual);
  const appBookings = activeBookings.filter((b) => !b.is_manual);
  const manualCount = manualBookings.length;
  const appCount = appBookings.length;

  const totalBookingsCount = activeBookings.length;
  const manualPct = totalBookingsCount > 0 ? Math.round((manualCount / totalBookingsCount) * 100) : 0;
  const appPct = totalBookingsCount > 0 ? Math.round((appCount / totalBookingsCount) * 100) : 0;

  // Estimativa de slots e ocupação
  const estimatedSlotsPerDay = (totalCourts > 0 ? totalCourts : 2) * 16; // 16h/dia operacionais
  const occupancyRate = estimatedSlotsPerDay > 0
    ? Math.min(100, Math.round((totalBookingsCount / estimatedSlotsPerDay) * 100))
    : 0;

  // Ticket Médio
  const ticketMedio = totalBookingsCount > 0 ? totalRevenue / totalBookingsCount : avgHourlyRate;

  // Métricas individuais por quadra
  const courtsPerformance = courts.map((court) => {
    const courtBookings = activeBookings.filter((b) => String(b.court_id) === String(court.id));
    const revenue = courtBookings.reduce((sum, b) => {
      const val = parseFloat(b.total_price || court.hourly_rate || 140);
      return sum + (isNaN(val) ? 140 : val);
    }, 0);

    return {
      id: court.id,
      name: court.name,
      hourly_rate: court.hourly_rate || 140,
      bookingsCount: courtBookings.length,
      revenue,
      occupancy: Math.min(100, Math.round((courtBookings.length / 16) * 100)),
    };
  });

  return (
    <ScrollView
      style={styles.container}
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
      {headerComponent}

      {/* Seletor de Período */}
      <View style={[styles.periodSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.periodTitleRow}>
          <BarChart3 size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.periodTitle, { color: colors.textPrimary }]}>Faturamento & Métricas do Complexo</Text>
        </View>

        <ScrollableRow
          edgeColor={colors.surface}
          contentContainerStyle={styles.periodChipsScrollContent}
          accessibilityLabel="Seletor de período. Arraste para o lado para ver mais períodos"
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPeriod('today')}
            style={[
              styles.periodChip,
              {
                backgroundColor: period === 'today' ? colors.primary : colors.background,
                borderColor: period === 'today' ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.periodChipText, { color: period === 'today' ? colors.white : colors.textMuted }]}>
              Hoje
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPeriod('week')}
            style={[
              styles.periodChip,
              {
                backgroundColor: period === 'week' ? colors.primary : colors.background,
                borderColor: period === 'week' ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.periodChipText, { color: period === 'week' ? colors.white : colors.textMuted }]}>
              Próximos 7 Dias
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPeriod('month')}
            style={[
              styles.periodChip,
              {
                backgroundColor: period === 'month' ? colors.primary : colors.background,
                borderColor: period === 'month' ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.periodChipText, { color: period === 'month' ? colors.white : colors.textMuted }]}>
              Este Mês
            </Text>
          </TouchableOpacity>
        </ScrollableRow>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Processando estatísticas...</Text>
        </View>
      ) : (
        <>
          {/* Grade de KPIs Principais (Métricas & Faturamento) */}
          <View style={styles.kpiGrid}>
            {/* KPI 1: Faturamento Estimado */}
            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.kpiHeader}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Faturamento Estimado</Text>
                <View style={[styles.iconBox, { backgroundColor: colors.successSurface }]}>
                  <DollarSign size={18} color={colors.success} />
                </View>
              </View>
              <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <View style={styles.kpiFooter}>
                <TrendingUp size={14} color={colors.success} style={{ marginRight: 4 }} />
                <Text style={[styles.kpiSubtext, { color: colors.success }]}>
                  {totalBookingsCount} agendamento{totalBookingsCount !== 1 ? 's' : ''} confirmado{totalBookingsCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {/* KPI 2: Quadras Ativas */}
            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.kpiHeader}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Quadras no Complexo</Text>
                <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                  <Layers size={18} color={colors.primary} />
                </View>
              </View>
              <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{totalCourts}</Text>
              <View style={styles.kpiFooter}>
                <CheckCircle2 size={14} color={colors.success} style={{ marginRight: 4 }} />
                <Text style={[styles.kpiSubtext, { color: colors.textMuted }]}>
                  Todas em operação normal
                </Text>
              </View>
            </View>

            {/* KPI 3: Preço Médio / Hora */}
            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.kpiHeader}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Preço Médio / Hora</Text>
                <View style={[styles.iconBox, { backgroundColor: colors.holdingSurface }]}>
                  <Clock size={18} color={colors.holding} />
                </View>
              </View>
              <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
                R$ {avgHourlyRate.toFixed(0)}
              </Text>
              <View style={styles.kpiFooter}>
                <Text style={[styles.kpiSubtext, { color: colors.textMuted }]}>
                  Ticket médio: R$ {ticketMedio.toFixed(0)} / jogo
                </Text>
              </View>
            </View>

            {/* KPI 4: Taxa de Ocupação */}
            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.kpiHeader}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Taxa de Ocupação</Text>
                <View style={[styles.iconBox, { backgroundColor: colors.warningSurface }]}>
                  <TrendingUp size={18} color="#F59E0B" />
                </View>
              </View>
              <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{occupancyRate}%</Text>
              <View style={styles.kpiFooter}>
                <Text style={[styles.kpiSubtext, { color: '#F59E0B' }]}>
                  {totalBookingsCount} de {estimatedSlotsPerDay} horários
                </Text>
              </View>
            </View>
          </View>

          {/* Origem dos Agendamentos (Balcão vs App) */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Users size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Origem dos Agendamentos</Text>
              </View>
              <Text style={[styles.cardBadgeText, { color: colors.textMuted }]}>Canais de Venda</Text>
            </View>

            {/* Barra Visual Proporcional */}
            <View style={[styles.progressBarContainer, { backgroundColor: colors.background }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${manualPct}%`, backgroundColor: colors.holding },
                ]}
              />
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${appPct}%`, backgroundColor: colors.info },
                ]}
              />
            </View>

            <View style={styles.channelDetailsRow}>
              <View style={[styles.channelCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.channelTitleRow}>
                  <Store size={16} color={colors.holding} style={{ marginRight: 6 }} />
                  <Text style={[styles.channelTitle, { color: colors.textPrimary }]}>Balcão / Presencial</Text>
                </View>
                <Text style={[styles.channelCount, { color: colors.holding }]}>{manualCount} reservas ({manualPct}%)</Text>
                <Text style={[styles.channelSubtext, { color: colors.textMuted }]}>
                  Inseridos manualmente pelo gestor
                </Text>
              </View>

              <View style={[styles.channelCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.channelTitleRow}>
                  <Smartphone size={16} color={colors.info} style={{ marginRight: 6 }} />
                  <Text style={[styles.channelTitle, { color: colors.textPrimary }]}>Aplicativo SFACCO</Text>
                </View>
                <Text style={[styles.channelCount, { color: colors.info }]}>{appCount} reservas ({appPct}%)</Text>
                <Text style={[styles.channelSubtext, { color: colors.textMuted }]}>
                  Reservas online feitas pelos atletas
                </Text>
              </View>
            </View>
          </View>

          {/* Desempenho Detalhado por Quadra */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Award size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Desempenho por Quadra</Text>
              </View>
              <Text style={[styles.cardBadgeText, { color: colors.textMuted }]}>Receita & Ocupação</Text>
            </View>

            {courtsPerformance.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Nenhuma quadra cadastrada para exibir métricas individuais.
              </Text>
            ) : (
              courtsPerformance.map((c) => (
                <View key={c.id} style={[styles.courtPerfRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.courtPerfInfo}>
                    <Text style={[styles.courtPerfName, { color: colors.textPrimary }]}>{c.name}</Text>
                    <Text style={[styles.courtPerfMeta, { color: colors.textMuted }]}>
                      Valor da hora: R$ {parseFloat(c.hourly_rate).toFixed(0)} • {c.bookingsCount} reservas
                    </Text>
                  </View>

                  <View style={styles.courtPerfValues}>
                    <Text style={[styles.courtPerfRevenue, { color: colors.success }]}>
                      R$ {c.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={[styles.courtPerfOccupancy, { color: colors.textMuted }]}>
                      {c.occupancy}% ocupado
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  periodSelector: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  periodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  periodTitle: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '800',
  },
  periodChipsScrollContent: {
    flexDirection: 'row',
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  periodChipText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '700',
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  kpiCard: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: '47%',
    minWidth: 135,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  kpiFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiSubtext: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
  card: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '800',
  },
  cardBadgeText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 10,
    borderRadius: 5,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  progressBarFill: {
    height: '100%',
  },
  channelDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  channelCard: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 240,
    minWidth: 200,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.sm,
  },
  channelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  channelTitle: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '700',
  },
  channelCount: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '800',
    marginBottom: 2,
  },
  channelSubtext: {
    fontSize: theme.typography.sizes.caption,
  },
  courtPerfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  courtPerfInfo: {
    flex: 1,
  },
  courtPerfName: {
    fontSize: 14,
    fontWeight: '700',
  },
  courtPerfMeta: {
    fontSize: theme.typography.sizes.caption,
    marginTop: 2,
  },
  courtPerfValues: {
    alignItems: 'flex-end',
  },
  courtPerfRevenue: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '800',
  },
  courtPerfOccupancy: {
    fontSize: theme.typography.sizes.caption,
    marginTop: 2,
  },
  emptyText: {
    fontSize: theme.typography.sizes.label,
    fontStyle: 'italic',
    paddingVertical: theme.spacing.sm,
  },
});
