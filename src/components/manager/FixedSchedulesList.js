import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Repeat, Plus, Trash2, Edit3, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import {
  getFixedSchedules,
  getFixedScheduleOccurrences,
  deleteFixedSchedule,
  unskipFixedScheduleDate,
  weekdayLabel,
  formatTime,
  formatDateBR,
  extractApiError,
} from '../../api/fixedSchedules';
import { getTodayStrInSaoPaulo } from '../../utils/datetime';
import { FixedDayModal } from './FixedDayModal';

/**
 * Gestão de horários fixos (séries semanais).
 *
 * Fluxo simples: cada série mostra as próximas datas como botões.
 * Tocar numa data abre o gerenciamento do dia (lançar com pagamento,
 * desmarcar só o dia, reativar, excluir a série) — sem prompts nem
 * campos avulsos de data.
 */
export function FixedSchedulesList({
  courts = [],
  onOpenCreate,
  onOpenEdit,
  onChanged,
  active = true,
}) {
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [courtFilter, setCourtFilter] = useState('ALL');
  const [error, setError] = useState(null);
  const [actingId, setActingId] = useState(null);
  // Dia em gerenciamento: { fixed, date, skipped, exception }
  const [dayCtx, setDayCtx] = useState(null);
  // Ocorrências expandidas: { [fixedId]: [{date, date_br, skipped}] }
  const [expandedId, setExpandedId] = useState(null);
  const [occMap, setOccMap] = useState({});
  const [occLoadingId, setOccLoadingId] = useState(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getFixedSchedules({ includeInactive: true });
      setItems(list);
    } catch (err) {
      setError(extractApiError(err, 'Não foi possível carregar os horários fixos.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active) {
      setCourtFilter('ALL');
      setExpandedId(null);
      fetchList();
    }
  }, [active, fetchList]);

  const confirm = (title, message, onOk, okLabel = 'Confirmar') => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) onOk();
    } else {
      Alert.alert(title, message, [
        { text: 'Cancelar', style: 'cancel' },
        { text: okLabel, style: 'destructive', onPress: onOk },
      ]);
    }
  };

  const handleDelete = (fixed) => {
    confirm(
      'Excluir série fixa',
      `"${fixed.customer_name}" toda ${weekdayLabel(fixed.day_of_week, true)} ${formatTime(fixed.start_time)} às ${formatTime(fixed.end_time)}.\n\nTodas as ocorrências futuras serão liberadas. Deseja continuar?`,
      async () => {
        setActingId(`del-${fixed.id}`);
        try {
          await deleteFixedSchedule(fixed.id);
          await fetchList();
          onChanged?.();
        } catch (err) {
          const msg = extractApiError(err, 'Não foi possível excluir.');
          if (Platform.OS === 'web') window.alert(msg);
          else Alert.alert('Erro', msg);
        } finally {
          setActingId(null);
        }
      },
      'Excluir série',
    );
  };

  const handleUnskip = async (fixed, exception) => {
    setActingId(`unskip-${exception.id}`);
    try {
      await unskipFixedScheduleDate(fixed.id, exception.id);
      await fetchList();
      setOccMap((prev) => {
        const next = { ...prev };
        delete next[fixed.id];
        return next;
      });
      onChanged?.();
    } catch (err) {
      const msg = extractApiError(err, 'Não foi possível reativar este dia.');
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Erro', msg);
    } finally {
      setActingId(null);
    }
  };

  const toggleOccurrences = async (fixed) => {
    if (String(expandedId) === String(fixed.id)) {
      setExpandedId(null);
      return;
    }
    setExpandedId(fixed.id);
    if (occMap[fixed.id]) return;
    setOccLoadingId(fixed.id);
    try {
      const occ = await getFixedScheduleOccurrences(fixed.id, { from: getTodayStrInSaoPaulo() });
      setOccMap((prev) => ({ ...prev, [fixed.id]: occ }));
    } catch (err) {
      const msg = extractApiError(err, 'Não foi possível carregar as próximas datas.');
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Erro', msg);
      setExpandedId(null);
    } finally {
      setOccLoadingId(null);
    }
  };

  // Toque numa data: abre o gerenciamento do dia (lançar/desmarcar/reativar).
  const openDay = (fixed, occ) => {
    const exception = (Array.isArray(fixed.exceptions) ? fixed.exceptions : [])
      .find((e) => String(e.date).substring(0, 10) === occ.date) || null;
    setDayCtx({ fixed, date: occ.date, skipped: Boolean(occ.skipped), exception });
  };

  const refreshAfterDayChange = async () => {
    await fetchList();
    setOccMap({});
    onChanged?.();
  };

  const courtName = (id) => courts.find((c) => String(c.id) === String(id))?.name || `Quadra ${id}`;
  const filtered = courtFilter === 'ALL'
    ? items
    : items.filter((f) => String(f.court_id) === String(courtFilter));

  return (
    <View>
      <View style={styles.toolbar}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setCourtFilter('ALL')}
            style={[
              styles.filterChip,
              {
                backgroundColor: courtFilter === 'ALL' ? colors.primary : colors.background,
                borderColor: courtFilter === 'ALL' ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.filterText, { color: courtFilter === 'ALL' ? colors.white : colors.textPrimary }]}>
              Todas
            </Text>
          </TouchableOpacity>
          {courts.map((c) => {
            const sel = String(courtFilter) === String(c.id);
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setCourtFilter(c.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: sel ? colors.primary : colors.background,
                    borderColor: sel ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.filterText, { color: sel ? colors.white : colors.textPrimary }]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          onPress={onOpenCreate}
          style={[styles.newBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Plus size={14} color={colors.white} />
          <Text style={styles.newBtnText}>Novo</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.helper, { color: colors.textMuted }]}>
        Toque em “Ver próximas datas” e depois numa data para lançar o dia com pagamento ou desmarcar só aquele dia.
      </Text>

      <View style={styles.list}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity onPress={fetchList} style={[styles.retryBtn, { borderColor: colors.border }]}>
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Tentar de novo</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Repeat size={28} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Nenhum horário fixo</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Ex: toda segunda 19:00 do Time do João. Toque em Novo para criar.
            </Text>
          </View>
        ) : (
          filtered.map((fixed) => {
            const isExpanded = String(expandedId) === String(fixed.id);
            const occ = occMap[fixed.id] || [];
            return (
              <View
                key={fixed.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.background,
                    borderColor: fixed.is_active ? colors.primary : colors.border,
                    opacity: fixed.is_active ? 1 : 0.7,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                      {fixed.customer_name}
                    </Text>
                    <Text style={[styles.cardSub, { color: colors.primary }]}>
                      Toda {weekdayLabel(fixed.day_of_week, true)} • {formatTime(fixed.start_time)} às {formatTime(fixed.end_time)}
                    </Text>
                    <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                      {courtName(fixed.court_id)} • de {formatDateBR(fixed.valid_from)}
                      {fixed.valid_until ? ` até ${formatDateBR(fixed.valid_until)}` : ' • sem fim'}
                      {!fixed.is_active ? ' • pausado' : ''}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => toggleOccurrences(fixed)}
                  style={[styles.occToggle, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  activeOpacity={0.7}
                >
                  <CalendarDays size={13} color={colors.primary} />
                  <Text style={[styles.occToggleText, { color: colors.primary }]}>
                    {isExpanded ? 'Ocultar próximas datas' : 'Ver próximas datas'}
                  </Text>
                  {isExpanded
                    ? <ChevronUp size={14} color={colors.primary} />
                    : <ChevronDown size={14} color={colors.primary} />}
                </TouchableOpacity>

                {isExpanded ? (
                  <View style={[styles.occBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {occLoadingId === fixed.id ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : occ.length === 0 ? (
                      <Text style={[styles.occEmpty, { color: colors.textMuted }]}>
                        Sem ocorrências futuras (verifique a vigência).
                      </Text>
                    ) : (
                      <>
                        <Text style={[styles.occHint, { color: colors.textMuted }]}>
                          Toque numa data para lançar com pagamento ou desmarcar só ela:
                        </Text>
                        <View style={styles.occChips}>
                          {occ.slice(0, 8).map((o) => (
                            <TouchableOpacity
                              key={o.date}
                              activeOpacity={0.7}
                              onPress={() => openDay(fixed, o)}
                              style={[
                                styles.occChip,
                                {
                                  backgroundColor: o.skipped ? colors.backgroundSecondary ?? colors.background : colors.primaryLight,
                                  borderColor: o.skipped ? colors.border : colors.primary,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.occChipText,
                                  {
                                    color: o.skipped ? colors.textMuted : colors.primary,
                                    textDecorationLine: o.skipped ? 'line-through' : 'none',
                                  },
                                ]}
                              >
                                {o.date_br}{o.skipped ? ' • off' : ''}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        {occ.length > 8 ? (
                          <Text style={[styles.occMore, { color: colors.textMuted }]}>
                            +{occ.length - 8} próximas datas…
                          </Text>
                        ) : null}
                      </>
                    )}
                  </View>
                ) : null}

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    onPress={() => toggleOccurrences(fixed)}
                    style={[styles.actionBtnPrimary, { backgroundColor: colors.primary }]}
                    activeOpacity={0.8}
                  >
                    <CalendarDays size={13} color="#FFF" />
                    <Text style={styles.actionPrimaryText}>Gerenciar dias</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onOpenEdit?.(fixed)}
                    style={[styles.actionBtn, { borderColor: colors.border }]}
                  >
                    <Edit3 size={13} color={colors.textPrimary} />
                    <Text style={[styles.actionText, { color: colors.textPrimary }]}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(fixed)}
                    disabled={actingId === `del-${fixed.id}`}
                    style={[styles.actionBtn, { borderColor: colors.error }]}
                  >
                    {actingId === `del-${fixed.id}` ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <>
                        <Trash2 size={13} color={colors.error} />
                        <Text style={[styles.actionText, { color: colors.error }]}>Excluir</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      <FixedDayModal
        visible={Boolean(dayCtx)}
        fixed={dayCtx?.fixed || null}
        date={dayCtx?.date || null}
        courts={courts}
        initialSkipped={dayCtx?.skipped || false}
        initialException={dayCtx?.exception || null}
        onClose={() => setDayCtx(null)}
        onChanged={refreshAfterDayChange}
        onOpenEdit={(f) => {
          setDayCtx(null);
          onOpenEdit?.(f);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: theme.spacing.xs,
  },
  filterRow: { flex: 1, flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: theme.radius.full, borderWidth: 1,
  },
  filterText: { fontSize: theme.typography.sizes.caption, fontWeight: '700' },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.md,
  },
  newBtnText: { color: '#FFF', fontWeight: '800', fontSize: theme.typography.sizes.bodySmall },
  helper: { fontSize: theme.typography.sizes.caption, marginBottom: theme.spacing.sm, lineHeight: 16 },
  list: { gap: 0 },
  center: { alignItems: 'center', padding: theme.spacing.xl, gap: 8 },
  errorText: { fontWeight: '700', textAlign: 'center' },
  retryBtn: {
    borderWidth: 1, borderRadius: theme.radius.md,
    paddingHorizontal: 16, paddingVertical: 8, marginTop: 8,
  },
  emptyTitle: { fontWeight: '800', fontSize: theme.typography.sizes.body, marginTop: 8 },
  emptyText: { textAlign: 'center', fontSize: theme.typography.sizes.bodySmall, marginTop: 4 },
  card: {
    borderWidth: 1, borderRadius: theme.radius.md,
    padding: theme.spacing.sm, marginBottom: theme.spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardTitle: { fontWeight: '800', fontSize: theme.typography.sizes.body },
  cardSub: { fontWeight: '700', fontSize: theme.typography.sizes.bodySmall, marginTop: 2 },
  cardMeta: { fontSize: theme.typography.sizes.caption, marginTop: 2 },
  occToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: theme.radius.md,
    paddingHorizontal: 10, paddingVertical: 7, marginTop: 8, alignSelf: 'flex-start',
  },
  occToggleText: { fontSize: theme.typography.sizes.caption, fontWeight: '800' },
  occBox: {
    borderWidth: 1, borderRadius: theme.radius.md,
    padding: theme.spacing.sm, marginTop: 8,
  },
  occEmpty: { fontSize: theme.typography.sizes.caption, fontStyle: 'italic' },
  occHint: { fontSize: theme.typography.sizes.caption, marginBottom: 6 },
  occChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  occChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: theme.radius.full, borderWidth: 1,
  },
  occChipText: { fontSize: theme.typography.sizes.caption, fontWeight: '700' },
  occMore: { fontSize: theme.typography.sizes.caption, marginTop: 6 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtnPrimary: {
    flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    borderRadius: theme.radius.md, paddingVertical: 8,
  },
  actionPrimaryText: { color: '#FFF', fontSize: theme.typography.sizes.caption, fontWeight: '800' },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    borderWidth: 1, borderRadius: theme.radius.md, paddingVertical: 8,
  },
  actionText: { fontSize: theme.typography.sizes.caption, fontWeight: '700' },
});
