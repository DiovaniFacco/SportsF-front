import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Calendar, X, ChevronRight } from 'lucide-react-native';
import { theme } from '../../styles/theme';

/**
 * Componente Seletor de Datas padronizado (Date Picker)
 * Impede que o usuário digite texto livre e quebre a validação de data.
 */
export function DatePickerInput({
  value,
  onChangeDate,
  colors,
  style,
  disabled = false,
  minDate,
  maxDate,
  placeholder = 'Selecione a data',
}) {
  const [modalVisible, setModalVisible] = useState(false);

  // Formatar ISO (YYYY-MM-DD) para exibição amigável (DD/MM/AAAA)
  const formatDisplayDate = (isoStr) => {
    if (!isoStr) return placeholder;
    const clean = isoStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  // Normalizar valor para YYYY-MM-DD
  const getIsoValue = () => {
    if (!value) {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    if (value.includes('/')) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return value;
  };

  // Na Web, utiliza o seletor nativo do navegador (<input type="date">)
  if (Platform.OS === 'web') {
    const isDark =
      colors.surface === '#1E293B' ||
      colors.surface === '#0F172A' ||
      colors.background === '#0B0F19' ||
      colors.background === '#0f172a';

    const isoVal = getIsoValue();

    return (
      <View
        style={[
          styles.webContainer,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            opacity: disabled ? 0.6 : 1,
          },
          style,
        ]}
      >
        <Calendar size={18} color={colors.primary} style={{ marginRight: 8 }} />
        <input
          type="date"
          value={isoVal}
          min={minDate}
          max={maxDate}
          disabled={disabled}
          onChange={(e) => {
            if (onChangeDate) {
              onChangeDate(e.target.value);
            }
          }}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: colors.textPrimary,
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            fontWeight: '600',
            cursor: disabled ? 'not-allowed' : 'pointer',
            colorScheme: isDark ? 'dark' : 'light',
          }}
        />
      </View>
    );
  }

  // No Mobile (React Native), exibe Modal com lista dos próximos 60 dias
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const isoStr = `${yyyy}-${mm}-${dd}`;

      let label = `${weekdays[d.getDay()]}, ${dd} de ${months[d.getMonth()]}`;
      if (i === 0) label += ' (Hoje)';
      else if (i === 1) label += ' (Amanhã)';

      dates.push({ isoStr, label });
    }
    return dates;
  };

  const handleSelectMobileDate = (isoStr) => {
    if (onChangeDate) {
      onChangeDate(isoStr);
    }
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={disabled}
        onPress={() => setModalVisible(true)}
        style={[
          styles.mobileBtn,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            opacity: disabled ? 0.6 : 1,
          },
          style,
        ]}
      >
        <Calendar size={18} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={[styles.dateText, { color: value ? colors.textPrimary : colors.textMuted }]}>
          {formatDisplayDate(value)}
        </Text>
        <ChevronRight size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Calendar size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Selecione a Data</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {generateDateOptions().map((item) => {
                const isSelected = getIsoValue() === item.isoStr;
                return (
                  <TouchableOpacity
                    key={item.isoStr}
                    activeOpacity={0.7}
                    onPress={() => handleSelectMobileDate(item.isoStr)}
                    style={[
                      styles.dateOption,
                      {
                        backgroundColor: isSelected ? colors.primaryLight : 'transparent',
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateOptionText,
                        {
                          color: isSelected ? colors.primary : colors.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    width: '100%',
  },
  mobileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    width: '100%',
  },
  dateText: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  modalCard: {
    width: '90%',
    maxWidth: 400,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  dateOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dateOptionText: {
    fontSize: theme.typography.sizes.body,
  },
});
