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
          ? { backgroundColor: colors.primary, shadowColor: colors.primary }
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    gap: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: theme.typography.sizes.bodySmall,
  },
});