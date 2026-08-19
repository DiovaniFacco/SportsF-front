import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SearchX } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';

export function EmptyState({ title, message, onResetFilters }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
        <SearchX size={32} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title || 'Nenhum complexo encontrado'}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message || 'Não encontramos nenhum espaço esportivo correspondente aos filtros aplicados.'}
      </Text>

      {onResetFilters ? (
        <TouchableOpacity activeOpacity={0.8} style={[styles.button, { backgroundColor: colors.primary }]} onPress={onResetFilters}>
          <Text style={[styles.buttonText, { color: colors.white }]}>Limpar filtros</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginVertical: theme.spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.sizes.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
    maxWidth: 320,
  },
  button: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: theme.typography.sizes.button,
  },
});
