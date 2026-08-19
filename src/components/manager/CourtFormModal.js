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
  Alert,
  Platform,
} from 'react-native';
import { X, Check, Dumbbell, ShieldAlert, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { getSports } from '../../api/sports';
import { createCourt, updateCourt } from '../../api/courts';

export function CourtFormModal({ visible, court, venueId, onClose, onSuccess }) {
  const { colors } = useTheme();
  const isEditing = !!court;

  const [name, setName] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [surface, setSurface] = useState('Grama Sintética Pro');
  const [capacity, setCapacity] = useState('10 a 12 Jogadores (5x5)');
  const [isCovered, setIsCovered] = useState(true);
  const [selectedSportIds, setSelectedSportIds] = useState([]);
  const [availableSports, setAvailableSports] = useState([]);

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
      setName(court.name || '');
      setHourlyRate(court.hourly_rate ? String(court.hourly_rate) : '');
      setSurface(court.surface || 'Grama Sintética Pro');
      setCapacity(court.capacity || '10 a 12 Jogadores');
      setIsCovered(court.is_covered !== undefined ? Boolean(court.is_covered) : true);
      
      if (Array.isArray(court.sports)) {
        // Mapear esportes existentes para IDs caso existam na lista
        const sportsList = court.sports;
        const matchedIds = availableSports
          .filter((s) => sportsList.some((cs) => (typeof cs === 'string' ? cs.toLowerCase() === s.name.toLowerCase() : cs.id === s.id)))
          .map((s) => s.id);
        setSelectedSportIds(matchedIds.length > 0 ? matchedIds : [1]);
      } else {
        setSelectedSportIds([1]);
      }
      setErrorMsg('');
    } else if (visible && !court) {
      // Reset form para criação
      setName('');
      setHourlyRate('150');
      setSurface('Grama Sintética Pro');
      setCapacity('10 a 12 Jogadores');
      setIsCovered(true);
      setSelectedSportIds([1]);
      setErrorMsg('');
    }
  }, [visible, court, availableSports]);

  const toggleSportSelect = (sportId) => {
    setSelectedSportIds((prev) => {
      if (prev.includes(sportId)) {
        if (prev.length === 1) return prev; // Mantém pelo menos um esporte
        return prev.filter((id) => id !== sportId);
      } else {
        return [...prev, sportId];
      }
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMsg('Informe o nome da quadra.');
      return;
    }

    const rateNum = parseFloat(hourlyRate.replace(',', '.'));
    if (isNaN(rateNum) || rateNum <= 0) {
      setErrorMsg('Informe um valor hora válido.');
      return;
    }

    if (selectedSportIds.length === 0) {
      setErrorMsg('Selecione pelo menos um esporte.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        name: name.trim(),
        hourly_rate: rateNum,
        surface: surface.trim(),
        capacity: capacity.trim(),
        is_covered: isCovered,
        sport_ids: selectedSportIds,
      };

      if (isEditing) {
        await updateCourt(court.id, payload);
      } else {
        await createCourt(venueId, payload);
      }

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      const apiMsg = err.response?.data?.message || err.message || 'Erro ao salvar dados da quadra.';
      setErrorMsg(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.titleRow}>
              <View style={[styles.iconBadge, { backgroundColor: colors.primary + '18' }]}>
                <Dumbbell size={20} color={colors.primary} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isEditing ? 'Editar Quadra' : 'Nova Quadra'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={colors.textMuted} />
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
                        <Text
                          style={[
                            styles.sportChipText,
                            { color: isSelected ? '#FFFFFF' : colors.text },
                          ]}
                        >
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
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.btnCancel, { borderColor: colors.border }]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={[styles.btnCancelText, { color: colors.textMuted }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnSave, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Sparkles size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.btnSaveText}>{isEditing ? 'Atualizar Quadra' : 'Criar Quadra'}</Text>
                </>
              )}
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
    padding: theme.spacing.md,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
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
  closeButton: {
    padding: 6,
  },
  modalBody: {
    padding: theme.spacing.lg,
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
  fieldGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.sizes.body1,
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
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    gap: theme.spacing.md,
  },
  btnCancel: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  btnCancelText: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '600',
  },
  btnSave: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
  },
  btnSaveText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
  },
});
