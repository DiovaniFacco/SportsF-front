import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { theme } from '../../styles/theme';

export function FilterChip({ label, icon: IconComponent, isSelected, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.chip, isSelected ? styles.chipSelected : styles.chipDefault]}
    >
      {IconComponent ? (
        <IconComponent size={14} color={isSelected ? theme.colors.white : theme.colors.primary} strokeWidth={isSelected ? 2 : 1.75} />
      ) : null}
      <Text style={[styles.label, isSelected ? styles.labelSelected : styles.labelDefault]}>
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
  },
  chipDefault: {
    backgroundColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '600',
  },
  labelDefault: {
    color: theme.colors.textSecondary,
  },
  labelSelected: {
    color: theme.colors.white,
    fontWeight: '700',
  },
});