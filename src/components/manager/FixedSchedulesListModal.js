import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Repeat } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { FixedSchedulesList } from './FixedSchedulesList';

/**
 * Modal que exibe a gestão de horários fixos (usado na agenda do gestor).
 * O conteúdo vive em FixedSchedulesList (reutilizado na aba "Horários Fixos").
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

  if (!visible) return null;

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

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <FixedSchedulesList
              courts={courts}
              onOpenCreate={onOpenCreate}
              onOpenEdit={onOpenEdit}
              onChanged={onChanged}
              active={visible}
            />
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
  body: { padding: theme.spacing.md },
});
