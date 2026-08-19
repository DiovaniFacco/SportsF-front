import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SearchX } from 'lucide-react';
import { theme } from '../../styles/theme';

export function EmptyState({ title, message, onResetFilters }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <SearchX size={32} color={theme.colors.primary} />
      </View>
      <Text style={styles.title}>{title || 'Nenhum complexo encontrado'}</Text>
      <Text style={styles.message}>
        {message || 'Não encontramos nenhum espaço esportivo correspondente aos filtros aplicados.'}
      </Text>

      {onResetFilters ? (
        <TouchableOpacity activeOpacity={0.8} style={styles.button} onPress={onResetFilters}>
          <Text style={styles.buttonText}>Limpar filtros</Text>
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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
    maxWidth: 320,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
  },
  buttonText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: theme.typography.sizes.button,
  },
});
