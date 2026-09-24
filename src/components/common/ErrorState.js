import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';

export function ErrorState({ title, message, onRetry }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.errorSurface, borderColor: colors.error }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
        <AlertTriangle size={32} color={colors.error} />
      </View>
      <Text style={[styles.title, { color: colors.error }]}>{title || 'Não conseguimos carregar os dados'}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message || 'Ocorreu um erro ao conectar ao servidor. Por favor, verifique sua conexão.'}
      </Text>

      {onRetry ? (
        <TouchableOpacity activeOpacity={0.8} style={[styles.button, { backgroundColor: colors.error }]} onPress={onRetry}>
          <Text style={[styles.buttonText, { color: colors.white }]}>Tentar novamente</Text>
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
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: theme.typography.sizes.button,
  },
});
