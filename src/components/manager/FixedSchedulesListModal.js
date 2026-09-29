import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { X, Repeat, Plus, Trash2, Edit3, CalendarOff, CalendarCheck } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import {
  getFixedSchedules,
  deleteFixedSchedule,
  skipFixedScheduleDate,
  unskipFixedScheduleDate,
  weekdayLabel,
  formatTime,
  formatDateBR,
  extractApiError,
} from '../../api/fixedSchedules';
import { getTodayStrInSaoPaulo } from '../../utils/datetime';
import { DatePickerInput } from '../common/DatePickerInput';

/**
 * Lista e gerencia as séries fixas do gestor:
 * editar, excluir série, desmarcar um dia, reativar dia.
 */
export function FixedSchedulesListModal({
  visible,
  onClose,
  courts = [],
  onOpenCreate,
  onOpenEdit,
  onChanged,
}) {
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [courtFilter, setCourtFilter] = useState('ALL');
  const [error, setError] = useState(null);
  const [actingId, setActingId] = useState(null);
  // Data escolhida por série para "desmarcar dia": { [fixedId]: 'YYYY-MM-DD' }
  const [skipDates, setSkipDates] = useState({});

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
    if (visible) {
      setCourtFilter('ALL');
      fetchList();
    }
  }, [visible, fetchList]);

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

  const handleSkip = async (fixed) => {
    const date = skipDates[fixed.id] || getTodayStrInSaoPaulo();
    setActingId(`skip-${fixed.id}`);
    try {
      await skipFixedScheduleDate(fixed.id, date);
      await fetchList();
      onChanged?.();
      const msg = `Horário desmarcado só para ${formatDateBR(date)}. A série continua nos demais dias.`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Desmarcado', msg);
    } catch (err) {
      const msg = extractApiError(err, 'Não foi possível desmarcar este dia.');
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Erro', msg);
    } finally {
      setActingId(null);
    }
  };

  const handleUnskip = async (fixed, exception) => {
    setActingId(`unskip-${exception.id}`);
    try {
      await unskipFixedScheduleDate(fixed.id, exception.id);
      await fetchList();
      onChanged?.();
    } catch (err) {
      const msg = extractApiError(err, 'Não foi possível reativar este dia.');
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Erro', msg);
    } finally {
      setActingId(null);
    }
  };

  if (!visible) return null;

  const courtName = (id) => courts.find((c) => String(c.id) === String(id))?.name || `Quadra ${id}`;
  const filtered = courtFilter === 'ALL'
    ? items
    : items.filter((f) => String(f.court_id) === String(courtFilter));

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Repeat size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Horários Fixos</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  Aulas/mensalistas que repetem toda semana
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            >
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
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
            </ScrollView>
            <TouchableOpacity
              onPress={onOpenCreate}
              style={[styles.newBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Plus size={14} color={colors.white} />
              <Text style={styles.newBtnText}>Novo</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
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
                const exceptions = Array.isArray(fixed.exceptions) ? fixed.exceptions : [];
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

                    {exceptions.length > 0 ? (
                      <View style={styles.exceptionsBox}>
                        <Text style={[styles.exceptionsTitle, { color: colors.textSecondary }]}>
                          Dias desmarcados ({exceptions.length}):
                        </Text>
                        {exceptions.map((ex) => (
                          <View key={ex.id} style={styles.exceptionRow}>
                            <Text style={[styles.exceptionDate, { color: colors.textPrimary }]}>
                              {formatDateBR(ex.date)}{ex.reason ? ` • ${ex.reason}` : ''}
                            </Text>
                            <TouchableOpacity
                              onPress={() => handleUnskip(fixed, ex)}
                              disabled={actingId === `unskip-${ex.id}`}
                              style={[styles.unskipBtn, { borderColor: colors.success }]}
                            >
                              {actingId === `unskip-${ex.id}` ? (
                                <ActivityIndicator size="small" color={colors.success} />
                              ) : (
                                <>
                                  <CalendarCheck size={12} color={colors.success} />
                                  <Text style={[styles.unskipText, { color: colors.success }]}>Reativar</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    <View style={styles.skipRow}>
                      <View style={{ flex: 1 }}>
                        <DatePickerInput
                          value={skipDates[fixed.id] || getTodayStrInSaoPaulo()}
                          onChangeDate={(d) => setSkipDates((prev) => ({ ...prev, [fixed.id]: d }))}
                          colors={colors}
                        />
                      </View>
                      <TouchableOpacity
                        onPress={() => handleSkip(fixed)}
                        disabled={actingId === `skip-${fixed.id}`}
                        style={[styles.skipBtn, { backgroundColor: colors.warning }]}
                        activeOpacity={0.8}
                      >
                        {actingId === `skip-${fixed.id}` ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <CalendarOff size={13} color="#FFF" />
                            <Text style={styles.skipBtnText}>Desmarcar dia</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>

                    <View style={styles.actionsRow}>
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
                            <Text style={[styles.actionText, { color: colors.error }]}>Excluir série</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  modalCard: {
    width: '96%',
    maxWidth: 600,
    maxHeight: '92%',
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: theme.typography.sizes.body, fontWeight: '800' },
  modalSubtitle: { fontSize: theme.typography.sizes.caption, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: theme.radius.full,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  filterRow: { flexDirection: 'row', gap: 6, flexGrow: 1, paddingRight: 8 },
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
  list: { padding: theme.spacing.md },
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
  exceptionsBox: { marginTop: 8, gap: 4 },
  exceptionsTitle: { fontSize: theme.typography.sizes.caption, fontWeight: '700' },
  exceptionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  },
  exceptionDate: { fontSize: theme.typography.sizes.bodySmall, fontWeight: '600', flex: 1 },
  unskipBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: theme.radius.md,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  unskipText: { fontSize: theme.typography.sizes.caption, fontWeight: '800' },
  skipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  skipBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 10, borderRadius: theme.radius.md,
  },
  skipBtnText: { color: '#FFF', fontWeight: '800', fontSize: theme.typography.sizes.caption },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    borderWidth: 1, borderRadius: theme.radius.md, paddingVertical: 8,
  },
  actionText: { fontSize: theme.typography.sizes.caption, fontWeight: '700' },
});
