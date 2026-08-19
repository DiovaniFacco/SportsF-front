import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle } from 'lucide-react';
import { theme } from '../../styles/theme';

export function ErrorState({ title, message, onRetry }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <AlertTriangle size={32} color={theme.colors.error} />
      </View>
      <Text style={styles.title}>{title || 'Não conseguimos carregar os dados'}</Text>
      <Text style={styles.message}>
        {message || 'Ocorreu um erro ao conectar ao servidor. Por favor, verifique sua conexão.'}
      </Text>

      {onRetry ? (
        <TouchableOpacity activeOpacity={0.8} style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Tentar novamente</Text>
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
    backgroundColor: theme.colors.errorSurface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.2)',
    marginVertical: theme.spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '800',
    color: theme.colors.error,
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
    backgroundColor: theme.colors.error,
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
