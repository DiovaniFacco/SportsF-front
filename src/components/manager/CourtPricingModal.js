import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  X,
  Tag,
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Zap,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import {
  getCourtPricingRules,
  createCourtPricingRule,
  deleteCourtPricingRule,
  getCourtSpecialPrices,
  createCourtSpecialPrice,
  deleteCourtSpecialPrice,
} from '../../api/pricing';

const DAYS_OF_WEEK = [
  { id: 0, label: 'Domingo' },
  { id: 1, label: 'Segunda-feira' },
  { id: 2, label: 'Terça-feira' },
  { id: 3, label: 'Quarta-feira' },
  { id: 4, label: 'Quinta-feira' },
  { id: 5, label: 'Sexta-feira' },
  { id: 6, label: 'Sábado' },
];

export function CourtPricingModal({ visible, court, onClose, onSuccess }) {
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState('nobre'); // 'nobre' | 'especial'

  // Standard Pricing Rule States (Horário Nobre)
  const [ruleDay, setRuleDay] = useState(1);
  const [ruleStartTime, setRuleStartTime] = useState('18:00');
  const [ruleEndTime, setRuleEndTime] = useState('22:00');
  const [ruleRate, setRuleRate] = useState('');
  const [ruleLabel, setRuleLabel] = useState('Horário de Pico');
  const [pricingRules, setPricingRules] = useState([]);

  // Helper para formatar ISO YYYY-MM-DD para o padrão brasileiro DD/MM/AAAA
  const formatBrDate = (isoDate) => {
    if (!isoDate) return '';
    const clean = isoDate.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  // Helper para converter DD/MM/AAAA ou YYYY-MM-DD em YYYY-MM-DD
  const parseInputDateToIso = (dateStr) => {
    if (!dateStr) return '';
    const trimmed = dateStr.trim();
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length === 3) {
        let day = parts[0].padStart(2, '0');
        let month = parts[1].padStart(2, '0');
        let year = parts[2];
        if (year.length === 2) year = `20${year}`;
        return `${year}-${month}-${day}`;
      }
    }
    return trimmed;
  };

  const getTodayBrDate = () => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}/${now.getFullYear()}`;
  };

  // Special Price States (Feriados / Datas)
  const [specialDate, setSpecialDate] = useState(getTodayBrDate());
  const [specialRate, setSpecialRate] = useState('');
  const [specialLabel, setSpecialLabel] = useState('Feriado / Data Especial');
  const [specialPrices, setSpecialPrices] = useState([]);

  // Status States
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchPricingData = useCallback(async () => {
    if (!court?.id) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const [rules, specials] = await Promise.all([
        getCourtPricingRules(court.id),
        getCourtSpecialPrices(court.id),
      ]);
      setPricingRules(rules);
      setSpecialPrices(specials);
    } catch (err) {
      console.warn('Erro ao buscar dados de precificação:', err);
    } finally {
      setLoading(false);
    }
  }, [court?.id]);

  useEffect(() => {
    if (visible && court) {
      setRuleRate(court.hourly_rate ? String(court.hourly_rate * 1.2) : '180');
      setSpecialRate(court.hourly_rate ? String(court.hourly_rate * 1.3) : '200');
      setSpecialDate(getTodayBrDate());
      setErrorMsg('');
      setSuccessMsg('');
      fetchPricingData();
    }
  }, [visible, court, fetchPricingData]);

  // Helper para formatar horários no formato HH:mm (ex: 9:00 -> 09:00)
  const formatTime = (t) => {
    if (!t) return '';
    const parts = t.trim().split(':');
    if (parts.length >= 2) {
      const h = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      return `${h}:${m}`;
    }
    return t.trim();
  };

  // Handler para salvar Regra de Horário Nobre
  const handleCreateRule = async () => {
    if (!court?.id) return;

    const rateNum = parseFloat(ruleRate.replace(',', '.'));
    if (isNaN(rateNum) || rateNum <= 0) {
      setErrorMsg('Informe um valor por hora válido para o horário nobre.');
      return;
    }

    if (!ruleStartTime.trim() || !ruleEndTime.trim()) {
      setErrorMsg('Informe os horários de início e fim da tarifa de pico.');
      return;
    }

    const startFormatted = formatTime(ruleStartTime);
    const endFormatted = formatTime(ruleEndTime);

    if (startFormatted >= endFormatted) {
      setErrorMsg('O horário inicial deve ser anterior ao horário final.');
      return;
    }

    // Validação de sobreposição no lado do cliente
    const hasOverlap = pricingRules.some((rule) => {
      if (Number(rule.day_of_week) !== Number(ruleDay)) return false;
      const rStart = rule.start_time.substring(0, 5);
      const rEnd = rule.end_time.substring(0, 5);
      return startFormatted < rEnd && endFormatted > rStart;
    });

    if (hasOverlap) {
      setErrorMsg('Já existe um horário nobre cadastrado para este dia da semana que se sobrepõe ao horário informado.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await createCourtPricingRule(court.id, {
        day_of_week: ruleDay,
        start_time: startFormatted,
        end_time: endFormatted,
        hourly_rate: rateNum,
        label: ruleLabel.trim() || 'Horário de Pico',
      });

      setSuccessMsg('Regra de Horário Nobre adicionada!');
      await fetchPricingData();
      onSuccess && onSuccess();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : null) ||
        'Erro ao adicionar regra de preço.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handler para remover Regra de Horário Nobre
  const handleDeleteRule = (ruleId) => {
    const doDelete = async () => {
      try {
        await deleteCourtPricingRule(ruleId);
        setPricingRules((prev) => prev.filter((r) => r.id !== ruleId));
        setSuccessMsg('Regra de preço removida.');
        onSuccess && onSuccess();
      } catch (err) {
        setErrorMsg('Não foi possível remover a regra.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Excluir esta regra de Horário Nobre?')) doDelete();
    } else {
      Alert.alert('Remover Regra', 'Deseja excluir esta tarifa diferenciada?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  // Handler para salvar Preço Especial por Data
  const handleCreateSpecialPrice = async () => {
    if (!court?.id) return;

    const rateNum = parseFloat(specialRate.replace(',', '.'));
    if (isNaN(rateNum) || rateNum <= 0) {
      setErrorMsg('Informe um valor válido para a data especial.');
      return;
    }

    if (!specialDate.trim()) {
      setErrorMsg('Informe a data no formato DD/MM/AAAA.');
      return;
    }

    const isoDate = parseInputDateToIso(specialDate);
    if (!isoDate || isoDate.length !== 10) {
      setErrorMsg('Informe uma data válida no formato DD/MM/AAAA (ex: 25/12/2026).');
      return;
    }

    // Validação de duplicidade de data no lado do cliente
    const hasDuplicateDate = specialPrices.some((sp) => {
      const spDate = sp.event_date ? sp.event_date.split('T')[0] : '';
      return spDate === isoDate;
    });

    if (hasDuplicateDate) {
      setErrorMsg('Já existe uma tarifa de feriado cadastrada para esta data.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await createCourtSpecialPrice(court.id, {
        event_date: isoDate,
        hourly_rate: rateNum,
        label: specialLabel.trim() || 'Data Especial / Feriado',
      });

      setSuccessMsg('Preço especial para feriado cadastrado com sucesso!');
      await fetchPricingData();
      onSuccess && onSuccess();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : null) ||
        'Erro ao cadastrar preço especial.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handler para remover Preço Especial
  const handleDeleteSpecialPrice = (specialId) => {
    const doDelete = async () => {
      try {
        await deleteCourtSpecialPrice(specialId);
        setSpecialPrices((prev) => prev.filter((s) => s.id !== specialId));
        setSuccessMsg('Preço especial removido.');
        onSuccess && onSuccess();
      } catch (err) {
        setErrorMsg('Não foi possível remover o preço especial.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Excluir este preço especial?')) doDelete();
    } else {
      Alert.alert('Remover Preço Especial', 'Deseja excluir a tarifa desta data?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.titleRow}>
              <View style={[styles.iconBadge, { backgroundColor: colors.primary + '18' }]}>
                <DollarSign size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Precificação Flexível</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  {court?.name || 'Quadra'} (Base: R$ {court?.hourly_rate || '150'}/h)
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Abas Superiores */}
          <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setActiveTab('nobre');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              style={[
                styles.tabBtn,
                activeTab === 'nobre' && [styles.activeTabBtn, { borderBottomColor: colors.primary }],
              ]}
            >
              <Zap size={16} color={activeTab === 'nobre' ? colors.primary : colors.textMuted} />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'nobre' ? colors.primary : colors.textMuted },
                ]}
              >
                Horários Nobres ({pricingRules.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setActiveTab('especial');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              style={[
                styles.tabBtn,
                activeTab === 'especial' && [styles.activeTabBtn, { borderBottomColor: colors.primary }],
              ]}
            >
              <Calendar size={16} color={activeTab === 'especial' ? colors.primary : colors.textMuted} />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'especial' ? colors.primary : colors.textMuted },
                ]}
              >
                Feriados & Datas ({specialPrices.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {errorMsg ? (
              <View style={[styles.alertBox, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
                <ShieldAlert size={18} color={colors.error} />
                <Text style={[styles.alertText, { color: colors.error }]}>{errorMsg}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={[styles.alertBox, { backgroundColor: colors.success + '15', borderColor: colors.success + '40' }]}>
                <CheckCircle2 size={18} color={colors.success} />
                <Text style={[styles.alertText, { color: colors.success }]}>{successMsg}</Text>
              </View>
            ) : null}

            {/* CONTEÚDO ABA: HORÁRIOS NOBRES */}
            {activeTab === 'nobre' ? (
              <View>
                <View style={[styles.cardForm, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.cardFormTitle, { color: colors.text }]}>Nova Tarifa de Pico</Text>

                  {/* Dia da Semana */}
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Dia da Semana</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {DAYS_OF_WEEK.map((d) => {
                          const isSelected = ruleDay === d.id;
                          return (
                            <TouchableOpacity
                              key={d.id}
                              onPress={() => setRuleDay(d.id)}
                              style={[
                                styles.chipDay,
                                {
                                  backgroundColor: isSelected ? colors.primary : colors.surface,
                                  borderColor: isSelected ? colors.primary : colors.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.chipDayText,
                                  { color: isSelected ? '#FFFFFF' : colors.text },
                                ]}
                              >
                                {d.label.split('-')[0]}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Horários Inicio e Fim */}
                  <View style={styles.rowInputs}>
                    <View style={styles.inputFlex}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Horário Inicial</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        placeholder="18:00"
                        placeholderTextColor={colors.textMuted}
                        value={ruleStartTime}
                        onChangeText={setRuleStartTime}
                      />
                    </View>
                    <View style={styles.inputFlex}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Horário Final</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        placeholder="22:00"
                        placeholderTextColor={colors.textMuted}
                        value={ruleEndTime}
                        onChangeText={setRuleEndTime}
                      />
                    </View>
                  </View>

                  {/* Valor por Hora e Rótulo */}
                  <View style={[styles.rowInputs, { marginTop: 10 }]}>
                    <View style={styles.inputFlex}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Tarifa / Hora (R$)</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        placeholder="180,00"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        value={ruleRate}
                        onChangeText={setRuleRate}
                      />
                    </View>
                    <View style={styles.inputFlex}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Descrição (Opicional)</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        placeholder="Horário de Pico"
                        placeholderTextColor={colors.textMuted}
                        value={ruleLabel}
                        onChangeText={setRuleLabel}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleCreateRule}
                    disabled={submitting}
                    style={[styles.btnAddRule, { backgroundColor: colors.primary }]}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.btnAddRuleText}>Adicionar Horário Nobre</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Lista de Regras de Horário Nobre */}
                <View style={{ marginTop: theme.spacing.md }}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Horários Nobres Ativos</Text>
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 14 }} />
                  ) : pricingRules.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                      Nenhuma tarifa de horário nobre cadastrada para esta quadra.
                    </Text>
                  ) : (
                    <View style={styles.rulesList}>
                      {pricingRules.map((rule) => {
                        const dayObj = DAYS_OF_WEEK.find((d) => d.id === Number(rule.day_of_week));
                        return (
                          <View
                            key={rule.id}
                            style={[
                              styles.ruleCard,
                              { backgroundColor: colors.background, borderColor: colors.border },
                            ]}
                          >
                            <View style={{ flex: 1 }}>
                              <View style={styles.ruleHeader}>
                                <Text style={[styles.ruleDayName, { color: colors.text }]}>
                                  {dayObj ? dayObj.label : `Dia ${rule.day_of_week}`}
                                </Text>
                                <View style={[styles.ruleBadge, { backgroundColor: colors.primary + '18' }]}>
                                  <Text style={[styles.ruleBadgeText, { color: colors.primary }]}>
                                    R$ {parseFloat(rule.hourly_rate).toFixed(2)}/h
                                  </Text>
                                </View>
                              </View>
                              <Text style={[styles.ruleTimeText, { color: colors.textMuted }]}>
                                🕒 {rule.start_time.substring(0, 5)} às {rule.end_time.substring(0, 5)} • {rule.label || 'Horário Nobre'}
                              </Text>
                            </View>

                            <TouchableOpacity
                              onPress={() => handleDeleteRule(rule.id)}
                              style={[styles.btnDeleteIcon, { backgroundColor: colors.error + '12' }]}
                            >
                              <Trash2 size={16} color={colors.error} />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            ) : (
              /* CONTEÚDO ABA: DATAS ESPECIAIS / FERIADOS */
              <View>
                <View style={[styles.cardForm, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.cardFormTitle, { color: colors.text }]}>Novo Preço em Data Especial</Text>

                  <View style={styles.rowInputs}>
                    <View style={styles.inputFlex}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Data do Feriado (DD/MM/AAAA)</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        placeholder="25/12/2026"
                        placeholderTextColor={colors.textMuted}
                        value={specialDate}
                        onChangeText={setSpecialDate}
                      />
                    </View>
                    <View style={styles.inputFlex}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Tarifa / Hora (R$)</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        placeholder="200,00"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        value={specialRate}
                        onChangeText={setSpecialRate}
                      />
                    </View>
                  </View>

                  <View style={{ marginTop: 10 }}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Nome do Evento / Feriado</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      placeholder="Ex: Feriado de Natal / Carnaval"
                      placeholderTextColor={colors.textMuted}
                      value={specialLabel}
                      onChangeText={setSpecialLabel}
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleCreateSpecialPrice}
                    disabled={submitting}
                    style={[styles.btnAddRule, { backgroundColor: colors.primary }]}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.btnAddRuleText}>Salvar Preço em Feriado</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Lista de Preços Especiais por Data */}
                <View style={{ marginTop: theme.spacing.md }}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Preços de Feriados Cadastrados</Text>
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 14 }} />
                  ) : specialPrices.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                      Nenhum preço por feriado cadastrado para esta quadra.
                    </Text>
                  ) : (
                    <View style={styles.rulesList}>
                      {specialPrices.map((sp) => (
                        <View
                          key={sp.id}
                          style={[
                            styles.ruleCard,
                            { backgroundColor: colors.background, borderColor: colors.border },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <View style={styles.ruleHeader}>
                              <Text style={[styles.ruleDayName, { color: colors.text }]}>
                                📅 {formatBrDate(sp.event_date)}
                              </Text>
                              <View style={[styles.ruleBadge, { backgroundColor: colors.primary + '18' }]}>
                                <Text style={[styles.ruleBadgeText, { color: colors.primary }]}>
                                  R$ {parseFloat(sp.hourly_rate).toFixed(2)}/h
                                </Text>
                              </View>
                            </View>
                            <Text style={[styles.ruleTimeText, { color: colors.textMuted }]}>
                              {sp.label || 'Data Especial'}
                            </Text>
                          </View>

                          <TouchableOpacity
                            onPress={() => handleDeleteSpecialPrice(sp.id)}
                            style={[styles.btnDeleteIcon, { backgroundColor: colors.error + '12' }]}
                          >
                            <Trash2 size={16} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.btnClose, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.btnCloseText, { color: colors.text }]}>Concluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs || 8,
    paddingVertical: theme.spacing.sm,
  },
  modalContainer: {
    width: '96%',
    maxWidth: 560,
    maxHeight: '92%',
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: theme.typography.sizes.caption,
  },
  closeButton: {
    padding: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  tabBtnText: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  alertText: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '600',
    flex: 1,
  },
  cardForm: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  cardFormTitle: {
    fontSize: theme.typography.sizes.body1,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  fieldGroup: {
    marginBottom: 10,
  },
  chipDay: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  chipDayText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  inputFlex: {
    flex: 1,
  },
  inputLabel: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.sizes.body2,
  },
  btnAddRule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.md,
  },
  btnAddRuleText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.body1,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: theme.typography.sizes.caption,
    fontStyle: 'italic',
  },
  rulesList: {
    gap: 8,
  },
  ruleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  ruleDayName: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
  },
  ruleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  ruleBadgeText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '800',
  },
  ruleTimeText: {
    fontSize: theme.typography.sizes.caption,
  },
  btnDeleteIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  modalFooter: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  btnClose: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  btnCloseText: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
  },
});
