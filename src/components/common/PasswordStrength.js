import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * Heurística simples de força: comprimento + variedade de caracteres.
 * Retorna { score: 0-4, label: 'Muito curta' | 'Fraca' | 'Média' | 'Forte' }.
 */
export function getPasswordStrength(password) {
  const pwd = String(password || '');
  if (pwd.length < 8) return { score: 0, label: 'Muito curta' };
  let score = 1;
  if (pwd.length >= 12) score += 1;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
  if (/\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score += 1;
  if (score <= 1) return { score: 1, label: 'Fraca' };
  if (score === 2) return { score: 2, label: 'Média' };
  return { score: 3, label: 'Forte' };
}

const BAR_COLORS = ['#EF4444', '#F59E0B', '#10B981'];

export function PasswordStrength({ password }) {
  const { colors } = useTheme();
  if (!password) return null;
  const { score, label } = getPasswordStrength(password);
  // score 0 (curta) acende 1 barra vermelha; 1-3 mapeiam para as cores.
  const level = score === 0 ? 0 : score - 1;
  const color = BAR_COLORS[level];

  return (
    <View style={styles.container}>
      <View style={styles.barsRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                backgroundColor: i <= level ? color : colors.border,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color }]}>Senha {label.toLowerCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  barsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
