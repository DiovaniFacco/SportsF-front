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
import { Clock, X, ChevronDown } from 'lucide-react-native';
import { theme } from '../../styles/theme';

/**
 * Componente Seletor de Horas padronizado (Time Picker)
 * Garante que o usuário escolha um horário válido (HH:mm) sem diigitação manual incorreta.
 */
export function TimePickerInput({
  value,
  onChangeTime,
  colors,
  style,
  disabled = false,
  step = '900', // 15 minutos na web por padrão
  placeholder = '00:00',
}) {
  const [modalVisible, setModalVisible] = useState(false);

  // Garantir formato HH:mm para exibição
  const formatTimeVal = (t) => {
    if (!t) return placeholder;
    const parts = t.trim().split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return t;
  };

  // Na Web, usa o seletor nativo do navegador (<input type="time">)
  if (Platform.OS === 'web') {
    const isDark =
      colors.surface === '#1E293B' ||
      colors.surface === '#0F172A' ||
      colors.background === '#0B0F19' ||
      colors.background === '#0f172a';

    const formattedValue = formatTimeVal(value);

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
        <Clock size={18} color={colors.primary} style={{ marginRight: 8 }} />
        <input
          type="time"
          lang="pt-BR"
          value={formattedValue.length === 5 ? formattedValue : '18:00'}
          step={step}
          disabled={disabled}
          onChange={(e) => {
            if (onChangeTime) {
              onChangeTime(e.target.value);
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

  // No Mobile (React Native), exibe Modal com lista de horários de 30 em 30 min (06:00 às 23:30)
  const generateTimeOptions = () => {
    const options = [];
    for (let h = 6; h <= 23; h++) {
      const hourStr = String(h).padStart(2, '0');
      options.push(`${hourStr}:00`);
      options.push(`${hourStr}:30`);
    }
    options.push('00:00');
    return options;
  };

  const handleSelectMobileTime = (t) => {
    if (onChangeTime) {
      onChangeTime(t);
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
        <Clock size={18} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={[styles.timeText, { color: value ? colors.textPrimary : colors.textMuted }]}>
          {formatTimeVal(value)}
        </Text>
        <ChevronDown size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Clock size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Selecione o Horário</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              <View style={styles.gridContainer}>
                {generateTimeOptions().map((timeItem) => {
                  const isSelected = formatTimeVal(value) === timeItem;
                  return (
                    <TouchableOpacity
                      key={timeItem}
                      activeOpacity={0.7}
                      onPress={() => handleSelectMobileTime(timeItem)}
                      style={[
                        styles.timeChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.timeChipText,
                          {
                            color: isSelected ? colors.white : colors.textPrimary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {timeItem}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
  timeText: {
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
    gap: 8,
    justifyContent: 'center',
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  timeChipText: {
    fontSize: theme.typography.sizes.body,
  },
});
