import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Compass, Calendar, User, Building2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';

export function BottomNav({ activeTab = 'explorar', onTabChange }) {
  const { colors } = useTheme();
  const { isManager } = useAuth();

  const navItems = [
    { id: 'explorar', label: 'Explorar', icon: Compass },
    { id: 'agendamentos', label: 'Meus Agendamentos', icon: Calendar },
  ];

  if (isManager) {
    navItems.push({ id: 'gestao', label: 'Gestão', icon: Building2 });
  }

  navItems.push({ id: 'perfil', label: 'Perfil', icon: User });

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const IconComponent = item.icon;
        const iconColor = isActive ? colors.primary : colors.textMuted;

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.75}
            onPress={() => onTabChange && onTabChange(item.id)}
            style={styles.navButton}
          >
            <IconComponent size={20} color={iconColor} strokeWidth={isActive ? 2.5 : 1.75} />
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.primary : colors.textMuted, fontWeight: isActive ? '700' : '500' },
              ]}
            >
              {item.label}
            </Text>
            {isActive ? <View style={[styles.activeDot, { backgroundColor: colors.primary }]} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000000',
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
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: theme.radius.full,
    marginTop: 1,
  },
});
