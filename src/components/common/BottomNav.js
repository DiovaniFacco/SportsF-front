import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Compass, Calendar, Bookmark, User } from 'lucide-react';
import { theme } from '../../styles/theme';

const NAV_ITEMS = [
  { id: 'explorar', label: 'Explorar', icon: Compass },
  { id: 'agendamentos', label: 'Agendamentos', icon: Calendar },
  { id: 'favoritos', label: 'Favoritos', icon: Bookmark },
  { id: 'perfil', label: 'Perfil', icon: User },
];

export function BottomNav({ activeTab = 'explorar', onTabChange }) {
  return (
    <View style={styles.container}>
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        const IconComponent = item.icon;
        const iconColor = isActive ? theme.colors.primary : theme.colors.textMuted;

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.75}
            onPress={() => onTabChange && onTabChange(item.id)}
            style={styles.navButton}
          >
            <IconComponent size={20} color={iconColor} strokeWidth={isActive ? 2.5 : 1.75} />
            <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
              {item.label}
            </Text>
            {isActive ? <View style={styles.activeDot} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
    zIndex: theme.zIndex.bottomNav,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    minHeight: 44,
    gap: 3,
  },
  label: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '500',
  },
  labelInactive: {
    color: theme.colors.textMuted,
  },
  labelActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    marginTop: 1,
  },
});
