import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { getTodayStrInSaoPaulo } from '../../utils/datetime';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function DateSelector({ selectedDate, onSelectDate, daysCount = 14 }) {
  const { colors } = useTheme();
  const scrollViewRef = useRef(null);

  // Gerar os próximos N dias a partir de hoje (hoje no fuso de SP,
  // âncora ao meio-dia UTC para não sofrer virada de dia no dispositivo).
  const days = [];
  const [baseY, baseM, baseD] = getTodayStrInSaoPaulo().split('-').map(Number);
  const base = new Date(Date.UTC(baseY, baseM - 1, baseD, 12));

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(base.getTime());
    d.setUTCDate(base.getUTCDate() + i);

    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getUTCDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayNum}`;

    let label = WEEKDAYS[d.getUTCDay()];
    if (i === 0) label = 'Hoje';
    else if (i === 1) label = 'Amanhã';

    days.push({
      dateStr,
      dayNumber: d.getUTCDate(),
      dayLabel: label,
      monthLabel: MONTHS[d.getUTCMonth()].toUpperCase(),
      isToday: i === 0,
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <Calendar size={16} color={colors.primary} />
          <Text style={[styles.titleText, { color: colors.textPrimary }]}>Data da partida</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {days.map((item) => {
          const isSelected = item.dateStr === selectedDate;

          return (
            <TouchableOpacity
              key={item.dateStr}
              activeOpacity={0.8}
              onPress={() => onSelectDate && onSelectDate(item.dateStr)}
              style={[
                styles.dayCard,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
                isSelected && styles.selectedShadow,
              ]}
            >
              <Text
                style={[
                  styles.dayLabel,
                  { color: isSelected ? colors.white : colors.textSecondary },
                  isSelected && styles.boldText,
                ]}
              >
                {item.dayLabel}
              </Text>
              
              <Text
                style={[
                  styles.dayNumber,
                  { color: isSelected ? colors.white : colors.textPrimary },
                ]}
              >
                {item.dayNumber}
              </Text>

              <Text
                style={[
                  styles.monthLabel,
                  { color: isSelected ? 'rgba(255, 255, 255, 0.85)' : colors.textMuted },
                ]}
              >
                {item.monthLabel}
              </Text>

              {item.isToday && !isSelected ? (
                <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  dayCard: {
    width: 68,
    height: 82,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
    position: 'relative',
  },
  selectedShadow: {
    ...theme.shadows.md,
  },
  dayLabel: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  boldText: {
    fontWeight: '700',
  },
  dayNumber: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '800',
    lineHeight: 24,
  },
  monthLabel: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
    marginTop: 1,
  },
  todayDot: {
    position: 'absolute',
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: theme.radius.full,
  },
});
