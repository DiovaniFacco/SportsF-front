import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  X,
  Check,
  Dumbbell,
  ShieldAlert,
  Sparkles,
  Clock,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Layers,
  Image as ImageIcon,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { getSports } from '../../api/sports';
import { createCourt, updateCourt } from '../../api/courts';
import { saveCourtOperatingHour, getCourtOperatingHours, deleteCourtOperatingHour } from '../../api/operatingHours';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Segunda-feira', short: 'Seg' },
  { id: 2, label: 'Terça-feira', short: 'Ter' },
  { id: 3, label: 'Quarta-feira', short: 'Qua' },
  { id: 4, label: 'Quinta-feira', short: 'Qui' },
  { id: 5, label: 'Sexta-feira', short: 'Sex' },
  { id: 6, label: 'Sábado', short: 'Sáb' },
  { id: 0, label: 'Domingo', short: 'Dom' },
];

const DEFAULT_WEEK_SHIFTS = [
  { day_of_week: 1, start_time: '08:00', end_time: '22:00', slot_duration_minutes: 60 },
  { day_of_week: 2, start_time: '08:00', end_time: '22:00', slot_duration_minutes: 60 },
  { day_of_week: 3, start_time: '08:00', end_time: '22:00', slot_duration_minutes: 60 },
  { day_of_week: 4, start_time: '08:00', end_time: '22:00', slot_duration_minutes: 60 },
  { day_of_week: 5, start_time: '08:00', end_time: '22:00', slot_duration_minutes: 60 },
  { day_of_week: 6, start_time: '08:00', end_time: '22:00', slot_duration_minutes: 60 },
  { day_of_week: 0, start_time: '08:00', end_time: '20:00', slot_duration_minutes: 60 },
];

export function CourtFormModal({ visible, court, venueId, onClose, onSuccess }) {
  const { colors } = useTheme();
  const isEditing = !!court;

  // Wizard Step
  const [step, setStep] = useState(1); // 1 = Dados da Quadra, 2 = Horários e Turnos/Gaps

  // Step 1: Dados Gerais
  const [name, setName] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [surface, setSurface] = useState('Grama Sintética Pro');
  const [capacity, setCapacity] = useState('10 a 12 Jogadores');
  const [isCovered, setIsCovered] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedSportIds, setSelectedSportIds] = useState([]);
  const [availableSports, setAvailableSports] = useState([]);

  // Step 2: Horários & Turnos
  const [operatingHours, setOperatingHours] = useState(DEFAULT_WEEK_SHIFTS);
  const [selectedDay, setSelectedDay] = useState(1); // Segunda por padrão
  const [newShiftStart, setNewShiftStart] = useState('08:00');
  const [newShiftEnd, setNewShiftEnd] = useState('22:00');
  const [newSlotDuration, setNewSlotDuration] = useState('60');

  const [loadingSports, setLoadingSports] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadSports() {
      setLoadingSports(true);
      try {
        const sportsData = await getSports();
        setAvailableSports(sportsData);
      } catch (err) {
        console.warn('Erro ao carregar esportes:', err);
      } finally {
        setLoadingSports(false);
      }
    }
    if (visible) {
      loadSports();
    }
  }, [visible]);

  useEffect(() => {
    if (visible && court) {
      setStep(1);
      setName(court.name || '');
      setHourlyRate(court.hourly_rate ? String(court.hourly_rate) : '');
      setSurface(court.surface || 'Grama Sintética Pro');
      setCapacity(court.capacity || '10 a 12 Jogadores');
      setIsCovered(court.is_covered !== undefined ? Boolean(court.is_covered) : true);
      setImageUrl(court.image_url || '');

      if (Array.isArray(court.sports)) {
        const sportsList = court.sports;
        const matchedIds = availableSports
          .filter((s) => sportsList.some((cs) => (typeof cs === 'string' ? cs.toLowerCase() === s.name.toLowerCase() : cs.id === s.id)))
          .map((s) => s.id);
        setSelectedSportIds(matchedIds.length > 0 ? matchedIds : [1]);
      } else {
        setSelectedSportIds([1]);
      }

      // Carregar horários existentes se for edição
      const existingHours = court.operating_hours || court.operatingHours;
      if (Array.isArray(existingHours) && existingHours.length > 0) {
        setOperatingHours(existingHours.map(h => ({
          id: h.id,
          day_of_week: Number(h.day_of_week),
          start_time: h.start_time.substring(0, 5),
          end_time: h.end_time.substring(0, 5),
          slot_duration_minutes: Number(h.slot_duration_minutes) || 60,
        })));
      }

      getCourtOperatingHours(court.id)
        .then((hours) => {
          if (Array.isArray(hours) && hours.length > 0) {
            setOperatingHours(hours.map(h => ({
              id: h.id,
              day_of_week: Number(h.day_of_week),
              start_time: h.start_time.substring(0, 5),
              end_time: h.end_time.substring(0, 5),
              slot_duration_minutes: Number(h.slot_duration_minutes) || 60,
            })));
          } else if (!existingHours || existingHours.length === 0) {
            setOperatingHours(DEFAULT_WEEK_SHIFTS);
          }
        })
        .catch(() => {
          if (!existingHours || existingHours.length === 0) {
            setOperatingHours(DEFAULT_WEEK_SHIFTS);
          }
        });

      setErrorMsg('');
    } else if (visible && !court) {
      // Reset form para nova criação
      setStep(1);
      setName('');
      setHourlyRate('150');
      setSurface('Grama Sintética Pro');
      setCapacity('10 a 12 Jogadores');
      setIsCovered(true);
      setImageUrl('');
      setSelectedSportIds([1]);
      setOperatingHours(DEFAULT_WEEK_SHIFTS);
      setErrorMsg('');
    }
  }, [visible, court, availableSports]);

  const toggleSportSelect = (sportId) => {
    setSelectedSportIds((prev) => {
      if (prev.includes(sportId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== sportId);
      } else {
        return [...prev, sportId];
      }
    });
  };

  const validateStep1 = () => {
    if (!name.trim()) {
      setErrorMsg('Informe o nome da quadra.');
      return false;
    }

    const rateNum = parseFloat(hourlyRate.replace(',', '.'));
    if (isNaN(rateNum) || rateNum <= 0) {
      setErrorMsg('Informe um valor por hora válido.');
      return false;
    }

    if (selectedSportIds.length === 0) {
      setErrorMsg('Selecione pelo menos uma modalidade esportiva.');
      return false;
    }

    setErrorMsg('');
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleAddShift = () => {
    if (!newShiftStart.trim() || !newShiftEnd.trim()) {
      setErrorMsg('Informe o horário de início e fim do turno.');
      return;
    }

    const duration = parseInt(newSlotDuration, 10);
    if (isNaN(duration) || duration < 15 || duration > 240) {
      setErrorMsg('Duração dos slots (gaps) deve ser entre 15 e 240 minutos.');
      return;
    }

    // Verificar se já existe exatamente esse turno
    const newShift = {
      day_of_week: selectedDay,
      start_time: newShiftStart.trim(),
      end_time: newShiftEnd.trim(),
      slot_duration_minutes: duration,
    };

    setOperatingHours((prev) => [...prev, newShift]);
    setErrorMsg('');
  };

  const handleRemoveShift = (indexToRemove) => {
    const shiftToRemove = currentDayShifts[indexToRemove];
    if (shiftToRemove?.id) {
      deleteCourtOperatingHour(shiftToRemove.id).catch(console.warn);
    }
    setOperatingHours((prev) => prev.filter((h, idx) => {
      const dayMatches = Number(h.day_of_week) === selectedDay;
      if (!dayMatches) return true;
      const dayShifts = prev.filter((item) => Number(item.day_of_week) === selectedDay);
      const shiftIndexInDay = dayShifts.indexOf(h);
      return shiftIndexInDay !== indexToRemove;
    }));
  };

  const handleApplyDefaultWeek = () => {
    setOperatingHours(DEFAULT_WEEK_SHIFTS);
    setErrorMsg('');
  };

  const handleClearShifts = () => {
    setOperatingHours([]);
  };

  const handleSubmitFinal = async () => {
    if (!validateStep1()) return;

    if (operatingHours.length === 0) {
      setErrorMsg('Cadastre pelo menos 1 turno de funcionamento para a quadra.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const rateNum = parseFloat(hourlyRate.replace(',', '.'));
      const payload = {
        name: name.trim(),
        type: 'Quadra',
        hourly_rate: rateNum,
        surface: surface.trim(),
        capacity: capacity.trim(),
        is_covered: isCovered,
        image_url: imageUrl.trim() || null,
        sport_ids: selectedSportIds,
        operating_hours: operatingHours,
      };

      if (isEditing) {
        await updateCourt(court.id, payload);
      } else {
        await createCourt(venueId, payload);
      }

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      const apiMsg = err.response?.data?.message || err.message || 'Erro ao criar/salvar quadra.';
      setErrorMsg(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter shifts for active selected day in Step 2
  const currentDayShifts = operatingHours.filter((h) => Number(h.day_of_week) === selectedDay);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.titleRow}>
              <View style={[styles.iconBadge, { backgroundColor: colors.primary + '18' }]}>
                <Dumbbell size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {isEditing ? 'Editar Quadra' : 'Nova Quadra'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  {step === 1 ? 'Passo 1 de 2: Dados Básicos' : 'Passo 2 de 2: Horários, Turnos e Gaps'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Stepper Indicator */}
          <View style={[styles.stepperBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => setStep(1)}
              style={[styles.stepTab, step === 1 && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            >
              <View style={[styles.stepNumber, { backgroundColor: step === 1 ? colors.primary : colors.border }]}>
                <Text style={[styles.stepNumberText, { color: step === 1 ? '#FFFFFF' : colors.textMuted }]}>1</Text>
              </View>
              <Text style={[styles.stepLabel, { color: step === 1 ? colors.text : colors.textMuted }]}>Dados da Quadra</Text>
            </TouchableOpacity>

            <ArrowRight size={16} color={colors.textMuted} />

            <TouchableOpacity
              onPress={() => {
                if (validateStep1()) setStep(2);
              }}
              style={[styles.stepTab, step === 2 && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            >
              <View style={[styles.stepNumber, { backgroundColor: step === 2 ? colors.primary : colors.border }]}>
                <Text style={[styles.stepNumberText, { color: step === 2 ? '#FFFFFF' : colors.textMuted }]}>2</Text>
              </View>
              <Text style={[styles.stepLabel, { color: step === 2 ? colors.text : colors.textMuted }]}>Horários & Gaps</Text>
            </TouchableOpacity>
          </View>

          {/* Form Body */}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {errorMsg ? (
              <View style={[styles.errorBox, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
                <ShieldAlert size={18} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* STEP 1: DADOS DA QUADRA */}
            {step === 1 ? (
              <View>
                {/* Nome da Quadra */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Nome da Quadra *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="Ex: Quadra Society 1 - Coberta"
                    placeholderTextColor={colors.textMuted}
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                {/* Valor Hora */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Valor por Hora (R$) *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="150,00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={hourlyRate}
                    onChangeText={setHourlyRate}
                  />
                </View>

                {/* Link da Imagem da Quadra */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Link da Imagem da Quadra (URL)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="https://exemplo.com/imagem-da-quadra.jpg"
                    placeholderTextColor={colors.textMuted}
                    value={imageUrl}
                    onChangeText={setImageUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {imageUrl.trim() ? (
                    <View style={[styles.imagePreviewContainer, { borderColor: colors.border }]}>
                      <Image
                        source={{ uri: imageUrl.trim() }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                    </View>
                  ) : null}
                </View>

                {/* Modalidades / Esportes */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Modalidades / Esportes Suportados *</Text>
                  {loadingSports ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />
                  ) : (
                    <View style={styles.sportsGrid}>
                      {availableSports.map((sport) => {
                        const isSelected = selectedSportIds.includes(sport.id);
                        return (
                          <TouchableOpacity
                            key={sport.id}
                            activeOpacity={0.7}
                            onPress={() => toggleSportSelect(sport.id)}
                            style={[
                              styles.sportChip,
                              {
                                backgroundColor: isSelected ? colors.primary : colors.background,
                                borderColor: isSelected ? colors.primary : colors.border,
                              },
                            ]}
                          >
                            <Text style={[styles.sportChipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                              {sport.name}
                            </Text>
                            {isSelected ? <Check size={14} color="#FFFFFF" style={{ marginLeft: 4 }} /> : null}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Tipo de Superfície / Piso */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Superfície / Piso</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="Ex: Grama Sintética Pro, Saibro, Piso Flutuante"
                    placeholderTextColor={colors.textMuted}
                    value={surface}
                    onChangeText={setSurface}
                  />
                </View>

                {/* Capacidade Recomendada */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Capacidade Recomendada</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="Ex: 10 a 12 Jogadores (5x5)"
                    placeholderTextColor={colors.textMuted}
                    value={capacity}
                    onChangeText={setCapacity}
                  />
                </View>

                {/* Quadra Coberta */}
                <View style={[styles.switchRow, { borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.switchTitle, { color: colors.text }]}>Quadra Coberta</Text>
                    <Text style={[styles.switchSubtitle, { color: colors.textMuted }]}>
                      Proteção contra chuva e luz solar direta
                    </Text>
                  </View>
                  <Switch
                    value={isCovered}
                    onValueChange={setIsCovered}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            ) : (
              /* STEP 2: HORÁRIOS, TURNOS E GAPS */
              <View>
                <View style={[styles.infoBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
                  <Clock size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoBannerTitle, { color: colors.text }]}>Defina os Horários e Turnos da Quadra</Text>
                    <Text style={[styles.infoBannerSub, { color: colors.textMuted }]}>
                      Escolha a duração de cada slot/gap (ex: 60 min) e os horários em que a quadra fica aberta para agendamentos.
                    </Text>
                  </View>
                </View>

                {/* Botões de Ação Rápida Presets */}
                <View style={styles.presetRow}>
                  <TouchableOpacity
                    onPress={handleApplyDefaultWeek}
                    style={[styles.presetBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                  >
                    <Sparkles size={14} color={colors.primary} />
                    <Text style={[styles.presetBtnText, { color: colors.text }]}>Aplicar Grade Padrão (08h às 22h)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleClearShifts}
                    style={[styles.presetBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                  >
                    <Trash2 size={14} color={colors.error} />
                    <Text style={[styles.presetBtnText, { color: colors.error }]}>Limpar Turnos</Text>
                  </TouchableOpacity>
                </View>

                {/* Seletor de Dia da Semana */}
                <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Selecione o Dia da Semana</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
                  <View style={styles.daysContainer}>
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = selectedDay === day.id;
                      const dayShiftsCount = operatingHours.filter((h) => Number(h.day_of_week) === day.id).length;
                      return (
                        <TouchableOpacity
                          key={day.id}
                          activeOpacity={0.7}
                          onPress={() => setSelectedDay(day.id)}
                          style={[
                            styles.dayChip,
                            {
                              backgroundColor: isSelected
                                ? colors.primary
                                : dayShiftsCount > 0
                                ? colors.primary + '15'
                                : colors.background,
                              borderColor: isSelected ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayChipText,
                              {
                                color: isSelected
                                  ? '#FFFFFF'
                                  : dayShiftsCount > 0
                                  ? colors.primary
                                  : colors.textMuted,
                              },
                            ]}
                          >
                            {day.short}
                          </Text>
                          {dayShiftsCount > 0 ? (
                            <View
                              style={[
                                styles.badgeCount,
                                {
                                  backgroundColor: isSelected ? '#FFFFFF' : colors.primary,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.badgeCountText,
                                  { color: isSelected ? colors.primary : '#FFFFFF' },
                                ]}
                              >
                                {dayShiftsCount}
                              </Text>
                            </View>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Turnos do Dia Selecionado */}
                <View style={[styles.sectionBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Turnos de {DAYS_OF_WEEK.find((d) => d.id === selectedDay)?.label}
                  </Text>

                  {currentDayShifts.length === 0 ? (
                    <View style={styles.emptyShiftsBox}>
                      <Text style={[styles.emptyShiftsText, { color: colors.textMuted }]}>
                        Nenhum turno cadastrado para este dia. Adicione um turno abaixo.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.shiftsList}>
                      {currentDayShifts.map((shift, idx) => (
                        <View
                          key={idx}
                          style={[styles.shiftCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        >
                          <View style={styles.shiftInfo}>
                            <Clock size={16} color={colors.primary} />
                            <Text style={[styles.shiftTimeText, { color: colors.text }]}>
                              {shift.start_time} - {shift.end_time}
                            </Text>
                            <View style={[styles.slotBadge, { backgroundColor: colors.primary + '15' }]}>
                              <Text style={[styles.slotBadgeText, { color: colors.primary }]}>
                                {shift.slot_duration_minutes} min/gap
                              </Text>
                            </View>
                          </View>

                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleRemoveShift(idx)}
                            style={[styles.btnDeleteShift, { backgroundColor: colors.error + '15' }]}
                          >
                            <Trash2 size={16} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Adicionar Novo Turno */}
                  <View style={[styles.addFormContainer, { borderTopColor: colors.border }]}>
                    <Text style={[styles.addFormTitle, { color: colors.text }]}>
                      + Adicionar Turno (Manhã, Tarde ou Noite)
                    </Text>

                    <View style={styles.rowInputs}>
                      <View style={styles.inputFlex}>
                        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Início (HH:MM)</Text>
                        <TextInput
                          style={[styles.inputSmall, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                          placeholder="08:00"
                          placeholderTextColor={colors.textMuted}
                          value={newShiftStart}
                          onChangeText={setNewShiftStart}
                        />
                      </View>

                      <View style={styles.inputFlex}>
                        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Fim (HH:MM)</Text>
                        <TextInput
                          style={[styles.inputSmall, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                          placeholder="22:00"
                          placeholderTextColor={colors.textMuted}
                          value={newShiftEnd}
                          onChangeText={setNewShiftEnd}
                        />
                      </View>

                      <View style={styles.inputFlex}>
                        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Dur. Gap (min)</Text>
                        <TextInput
                          style={[styles.inputSmall, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                          placeholder="60"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="numeric"
                          value={newSlotDuration}
                          onChangeText={setNewSlotDuration}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleAddShift}
                      style={[styles.btnAddShift, { backgroundColor: colors.primary }]}
                    >
                      <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.btnAddShiftText}>Adicionar Este Turno</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Modal Footer Actions */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            {step === 1 ? (
              <>
                <TouchableOpacity
                  style={[styles.btnCancel, { borderColor: colors.border }]}
                  onPress={onClose}
                  disabled={submitting}
                >
                  <Text style={[styles.btnCancelText, { color: colors.textMuted }]}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnSave, { backgroundColor: colors.primary }]}
                  onPress={handleNextStep}
                >
                  <Text style={styles.btnSaveText}>Próximo: Horários & Turnos</Text>
                  <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.btnCancel, { borderColor: colors.border }]}
                  onPress={() => setStep(1)}
                  disabled={submitting}
                >
                  <ArrowLeft size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
                  <Text style={[styles.btnCancelText, { color: colors.textMuted }]}>Voltar aos Dados</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnSave, { backgroundColor: colors.primary }]}
                  onPress={handleSubmitFinal}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Sparkles size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.btnSaveText}>
                        {isEditing ? 'Salvar Alterações' : 'Criar Quadra Definitivamente'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
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
    maxWidth: 580,
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: theme.typography.sizes.body1,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: theme.typography.sizes.caption,
  },
  closeButton: {
    padding: 6,
  },
  stepperBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.sm,
    borderBottomWidth: 1,
    gap: 4,
  },
  stepTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 4,
    flexShrink: 1,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 10,
    fontWeight: '800',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalBody: {
    padding: theme.spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  errorText: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '600',
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  infoBannerTitle: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
  },
  infoBannerSub: {
    fontSize: theme.typography.sizes.caption,
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.sizes.body1,
  },
  inputSmall: {
    height: 40,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: 8,
    fontSize: theme.typography.sizes.body2,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  sportChipText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    marginTop: theme.spacing.sm,
  },
  switchTitle: {
    fontSize: theme.typography.sizes.body1,
    fontWeight: '600',
  },
  switchSubtitle: {
    fontSize: theme.typography.sizes.caption,
    marginTop: 2,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 6,
  },
  presetBtnText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
  daysScroll: {
    marginBottom: theme.spacing.md,
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dayChipText: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
  },
  badgeCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  sectionBox: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.body1,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  emptyShiftsBox: {
    paddingVertical: 10,
  },
  emptyShiftsText: {
    fontSize: theme.typography.sizes.caption,
    fontStyle: 'italic',
  },
  shiftsList: {
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  shiftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shiftTimeText: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
  },
  slotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  slotBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  btnDeleteShift: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFormContainer: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
  },
  addFormTitle: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  rowInputs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inputFlex: {
    flex: 1,
    minWidth: 80,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  btnAddShift: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.md,
  },
  btnAddShiftText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    gap: 8,
  },
  btnCancel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 11,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  imagePreviewContainer: {
    height: 120,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  btnSave: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 11,
    borderRadius: theme.radius.md,
  },
  btnSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
