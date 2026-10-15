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
  Users,
  UserX,
  UserCheck,
  Eye,
  Activity,
  Clock,
  BarChart3,
  Globe,
  Smartphone,
  Building2,
  TrendingUp,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { getAnalyticsOverview, getVenueAnalytics } from '../../api/analytics';
import { ScrollableRow } from '../common/ScrollableRow';

const SCREEN_LABELS = {
  app: 'Abertura do app',
  explorar: 'Início (lista de complexos)',
  complexo: 'Página do complexo',
  'quadra-slots': 'Quadra / Horários',
  agendamentos: 'Meus agendamentos',
  perfil: 'Perfil',
  gestao: 'Painel de gestão',
  'auth-login': 'Login',
  'auth-register': 'Cadastro',
  'auth-forgot': 'Esqueci a senha',
  'auth-reset': 'Redefinir senha',
};

const PLATFORM_LABELS = {
  web: 'Web',
  android: 'Android',
  ios: 'iOS',
  desconhecido: 'Desconhecido',
};

function screenLabel(screen) {
  if (!screen) return '—';
  return SCREEN_LABELS[screen] || screen;
}

function platformLabel(platform) {
  if (!platform) return 'Desconhecido';
  return PLATFORM_LABELS[platform] || platform;
}

function timeAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

export function ManagerAnalyticsView({ isAdmin = false, venueId = null }) {
  const { colors } = useTheme();

  const [period, setPeriod] = useState('today'); // 'today' | 'week' | 'month'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const res = venueId
        ? await getVenueAnalytics(venueId, { period })
        : await getAnalyticsOverview({ period });
      setData(res);
    } catch (err) {
      setError('Não foi possível carregar as métricas de acesso.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, venueId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const totals = data?.totals || {};
  const scopedToVenue = data?.scope === 'venue' || !!venueId;
  const maxDaily = Math.max(1, ...((data?.daily || []).map((d) => d.total || 0)));
  // Percentuais de ACESSOS (entradas/sessões), não de visitantes únicos.
  const anonSessionPct = totals.anonymous_session_percentage ?? 0;
  const loggedSessionPct = totals.logged_session_percentage ?? 0;

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
      {/* Cabeçalho + seletor de período */}
      <View style={[styles.periodSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.periodTitleRow}>
          <Activity size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.periodTitle, { color: colors.textPrimary }]}>Acessos ao Sistema</Text>
        </View>
        <Text style={[styles.scopeHint, { color: colors.textMuted }]}>
          {scopedToVenue
            ? 'Tráfego do complexo selecionado'
            : isAdmin
            ? 'Tráfego de todos os complexos (visão global)'
            : 'Tráfego dos seus complexos'}
        </Text>

        <ScrollableRow
          edgeColor={colors.surface}
          contentContainerStyle={styles.periodChipsScrollContent}
          accessibilityLabel="Seletor de período. Arraste para o lado para ver mais períodos"
        >
          {[
            { key: 'today', label: 'Hoje' },
            { key: 'week', label: 'Últimos 7 dias' },
            { key: 'month', label: 'Este mês' },
          ].map((opt) => {
            const active = period === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.7}
                onPress={() => setPeriod(opt.key)}
                style={[
                  styles.periodChip,
                  {
                    backgroundColor: active ? colors.primary : colors.background,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.periodChipText, { color: active ? colors.white : colors.textMuted }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollableRow>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Carregando acessos...</Text>
        </View>
      ) : error ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => fetchData()}
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* KPIs */}
          <View style={styles.kpiGrid}>
            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.kpiHeader}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Visitantes únicos</Text>
                <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                  <Users size={18} color={colors.primary} />
                </View>
              </View>
              <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
                {(totals.unique_visitors || 0).toLocaleString('pt-BR')}
              </Text>
              <View style={styles.kpiFooter}>
                <Clock size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
                <Text style={[styles.kpiSubtext, { color: colors.textMuted }]}>
                  {totals.sessions || 0} {(totals.sessions || 0) === 1 ? 'acesso' : 'acessos'} no período
                </Text>
              </View>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.kpiHeader}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Acessos</Text>
                <View style={[styles.iconBox, { backgroundColor: colors.holdingSurface }]}>
                  <UserX size={18} color={colors.holding} />
                </View>
              </View>
              <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
                {(totals.anonymous_sessions || 0).toLocaleString('pt-BR')}
              </Text>
              <View style={styles.kpiFooter}>
                <TrendingUp size={14} color={colors.holding} style={{ marginRight: 4 }} />
                <Text style={[styles.kpiSubtext, { color: colors.holding }]}>
                  {anonSessionPct}% dos acessos
                </Text>
              </View>
              <Text style={[styles.kpiHint, { color: colors.textMuted }]}>
                {(totals.anonymous_visitors || 0).toLocaleString('pt-BR')} visitante
                {(totals.anonymous_visitors || 0) === 1 ? '' : 's'} única
                {(totals.anonymous_visitors || 0) === 1 ? '' : 's'}
              </Text>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.kpiHeader}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Acessos logados</Text>
                <View style={[styles.iconBox, { backgroundColor: colors.infoSurface }]}>
                  <UserCheck size={18} color={colors.info} />
                </View>
              </View>
              <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
                {(totals.logged_sessions || 0).toLocaleString('pt-BR')}
              </Text>
              <View style={styles.kpiFooter}>
                <TrendingUp size={14} color={colors.info} style={{ marginRight: 4 }} />
                <Text style={[styles.kpiSubtext, { color: colors.info }]}>
                  {loggedSessionPct}% dos acessos
                </Text>
              </View>
              <Text style={[styles.kpiHint, { color: colors.textMuted }]}>
                {(totals.logged_visitors || 0).toLocaleString('pt-BR')} usuário
                {(totals.logged_visitors || 0) === 1 ? '' : 's'} único
                {(totals.logged_visitors || 0) === 1 ? '' : 's'}
              </Text>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.kpiHeader}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Visualizações</Text>
                <View style={[styles.iconBox, { backgroundColor: colors.successSurface }]}>
                  <Eye size={18} color={colors.success} />
                </View>
              </View>
              <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
                {(totals.events || 0).toLocaleString('pt-BR')}
              </Text>
              <View style={styles.kpiFooter}>
                <Eye size={14} color={colors.success} style={{ marginRight: 4 }} />
                <Text style={[styles.kpiSubtext, { color: colors.textMuted }]}>
                  {totals.anonymous_events || 0} anônimas • {totals.logged_events || 0} logadas
                </Text>
              </View>
            </View>
          </View>

          {/* Anônimos vs Logados */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Users size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Anônimos vs Logados</Text>
              </View>
              <Text style={[styles.cardBadgeText, { color: colors.textMuted }]}>Acessos (entradas)</Text>
            </View>

            <View style={[styles.progressBarContainer, { backgroundColor: colors.background }]}>
              <View style={[styles.progressBarFill, { width: `${anonSessionPct}%`, backgroundColor: colors.holding }]} />
              <View style={[styles.progressBarFill, { width: `${loggedSessionPct}%`, backgroundColor: colors.info }]} />
            </View>

            <View style={styles.channelDetailsRow}>
              <View style={[styles.channelCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.channelTitleRow}>
                  <UserX size={16} color={colors.holding} style={{ marginRight: 6 }} />
                  <Text style={[styles.channelTitle, { color: colors.textPrimary }]}>Não logados</Text>
                </View>
                <Text style={[styles.channelCount, { color: colors.holding }]}>
                  {(totals.anonymous_sessions || 0).toLocaleString('pt-BR')} ({anonSessionPct}%)
                </Text>
                <Text style={[styles.channelSubtext, { color: colors.textMuted }]}>
                  Entradas sem autenticação • {(totals.anonymous_visitors || 0).toLocaleString('pt-BR')} visitante
                  {(totals.anonymous_visitors || 0) === 1 ? '' : 's'} única
                  {(totals.anonymous_visitors || 0) === 1 ? '' : 's'}
                </Text>
              </View>

              <View style={[styles.channelCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.channelTitleRow}>
                  <UserCheck size={16} color={colors.info} style={{ marginRight: 6 }} />
                  <Text style={[styles.channelTitle, { color: colors.textPrimary }]}>Logados</Text>
                </View>
                <Text style={[styles.channelCount, { color: colors.info }]}>
                  {(totals.logged_sessions || 0).toLocaleString('pt-BR')} ({loggedSessionPct}%)
                </Text>
                <Text style={[styles.channelSubtext, { color: colors.textMuted }]}>
                  Entradas autenticadas • {(totals.logged_visitors || 0).toLocaleString('pt-BR')} usuário
                  {(totals.logged_visitors || 0) === 1 ? '' : 's'} único
                  {(totals.logged_visitors || 0) === 1 ? '' : 's'}
                </Text>
              </View>
            </View>
          </View>

          {/* Série diária */}
          {(data?.daily?.length || 0) > 0 ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <BarChart3 size={18} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Acessos por dia</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: colors.holding }]} />
                  <Text style={[styles.legendText, { color: colors.textMuted }]}>Anôn.</Text>
                  <View style={[styles.legendDot, { backgroundColor: colors.info, marginLeft: 8 }]} />
                  <Text style={[styles.legendText, { color: colors.textMuted }]}>Log.</Text>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
                {(data?.daily || []).map((d) => {
                  const total = d.total || 0;
                  const height = Math.round((total / maxDaily) * 70);
                  const anonH = total > 0 ? Math.round((d.anonymous / total) * height) : 0;
                  const loggedH = height - anonH;
                  return (
                    <View key={d.date} style={styles.dayCol}>
                      <Text style={[styles.dayValue, { color: colors.textMuted }]}>{total > 0 ? total : ''}</Text>
                      <View style={[styles.dayBarWrap, { backgroundColor: colors.background }]}>
                        <View style={{ width: '100%' }}>
                          <View style={{ height: loggedH, backgroundColor: colors.info }} />
                          <View style={{ height: anonH, backgroundColor: colors.holding }} />
                        </View>
                      </View>
                      <Text style={[styles.dayLabel, { color: colors.textMuted }]}>{d.date.slice(8, 10)}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* Telas mais acessadas */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Eye size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Telas mais acessadas</Text>
              </View>
              <Text style={[styles.cardBadgeText, { color: colors.textMuted }]}>Visualizações</Text>
            </View>

            {(data?.screens?.length || 0) === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Nenhum acesso registrado neste período.
              </Text>
            ) : (
              (data?.screens || []).map((s) => (
                <View key={s.screen} style={[styles.row, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.rowLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                    {screenLabel(s.screen)}
                  </Text>
                  <Text style={[styles.rowValue, { color: colors.primary }]}>
                    {s.views.toLocaleString('pt-BR')}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Plataformas */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Globe size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Origem dos acessos</Text>
              </View>
              <Text style={[styles.cardBadgeText, { color: colors.textMuted }]}>Plataforma</Text>
            </View>

            {(data?.platforms?.length || 0) === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Sem dados no período.</Text>
            ) : (
              (data?.platforms || []).map((p) => {
                const Icon = p.platform === 'web' ? Globe : Smartphone;
                return (
                  <View key={p.platform} style={[styles.row, { borderBottomColor: colors.border }]}>
                    <View style={styles.rowIconLabel}>
                      <Icon size={15} color={colors.textMuted} style={{ marginRight: 6 }} />
                      <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                        {platformLabel(p.platform)}
                      </Text>
                    </View>
                    <Text style={[styles.rowValue, { color: colors.primary }]}>
                      {p.events.toLocaleString('pt-BR')}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          {/* Por complexo */}
          {!scopedToVenue && (data?.venues?.length || 0) > 0 ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Building2 size={18} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Acessos por complexo</Text>
                </View>
                <Text style={[styles.cardBadgeText, { color: colors.textMuted }]}>Acessos</Text>
              </View>

              {(data?.venues || []).map((v) => (
                <View key={String(v.venue_id ?? 'root')} style={[styles.row, { borderBottomColor: colors.border }]}>
                  <View style={styles.venueInfo}>
                    <Text style={[styles.rowLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                      {v.name}
                    </Text>
                    <Text style={[styles.rowMeta, { color: colors.textMuted }]}>
                      {v.anonymous_sessions || 0} não logados • {v.logged_sessions || 0} logados
                    </Text>
                  </View>
                  <Text style={[styles.rowValue, { color: colors.primary }]}>
                    {(v.sessions || 0).toLocaleString('pt-BR')}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Acessos recentes */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Clock size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Acessos recentes</Text>
              </View>
              <Text style={[styles.cardBadgeText, { color: colors.textMuted }]}>Últimos 25</Text>
            </View>

            {(data?.recent?.length || 0) === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Nenhum acesso registrado neste período.
              </Text>
            ) : (
              (data?.recent || []).map((r) => (
                <View key={r.id} style={[styles.recentRow, { borderBottomColor: colors.border }]}>
                  <View
                    style={[
                      styles.badgePill,
                      { backgroundColor: r.anonymous ? colors.holdingSurface : colors.infoSurface },
                    ]}
                  >
                    <Text style={[styles.badgePillText, { color: r.anonymous ? colors.holding : colors.info }]}>
                      {r.anonymous ? 'Anônimo' : 'Logado'}
                    </Text>
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={[styles.recentTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {r.anonymous ? 'Visitante não logado' : r.user_name || 'Usuário'}
                      {r.venue_name ? ` • ${r.venue_name}` : ''}
                    </Text>
                    <Text style={[styles.recentMeta, { color: colors.textMuted }]} numberOfLines={1}>
                      {screenLabel(r.screen)} • {platformLabel(r.platform)} • {r.ip || 'IP indisponível'}
                    </Text>
                  </View>
                  <Text style={[styles.recentTime, { color: colors.textMuted }]}>{timeAgo(r.created_at)}</Text>
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
    marginBottom: 2,
  },
  periodTitle: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '800',
  },
  scopeHint: {
    fontSize: theme.typography.sizes.caption,
    marginBottom: theme.spacing.sm,
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
  kpiHint: {
    fontSize: 10,
    marginTop: 4,
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
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
  chartScroll: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingVertical: 4,
    minWidth: '100%',
  },
  dayCol: {
    alignItems: 'center',
    width: 22,
  },
  dayValue: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 2,
  },
  dayBarWrap: {
    height: 76,
    width: 14,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  rowIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  rowMeta: {
    fontSize: theme.typography.sizes.caption,
    marginTop: 2,
  },
  rowValue: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '800',
  },
  venueInfo: {
    flex: 1,
    marginRight: 8,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    gap: 8,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  badgePillText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '800',
  },
  recentInfo: {
    flex: 1,
    minWidth: 0,
  },
  recentTitle: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '700',
  },
  recentMeta: {
    fontSize: theme.typography.sizes.caption,
    marginTop: 1,
  },
  recentTime: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: theme.typography.sizes.label,
    fontStyle: 'italic',
    paddingVertical: theme.spacing.sm,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: theme.typography.sizes.label,
  },
});
