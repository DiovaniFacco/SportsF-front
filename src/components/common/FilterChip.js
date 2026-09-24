import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';

export function FilterChip({ label, icon: IconComponent, isSelected, onPress }) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.chip,
        isSelected
          ? { backgroundColor: colors.primary, borderColor: colors.primary, borderWidth: 1, ...theme.shadows.sm }
          : { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, borderWidth: 1 },
      ]}
    >
      {IconComponent ? (
        <IconComponent
          size={14}
          color={isSelected ? colors.white : colors.primary}
          strokeWidth={isSelected ? 2 : 1.75}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          { color: isSelected ? colors.white : colors.textSecondary, fontWeight: isSelected ? '700' : '600' },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.sizes.bodySmall,
  },
});