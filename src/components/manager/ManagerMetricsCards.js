import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { DollarSign, TrendingUp, Users, Store, Smartphone, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';

export function ManagerMetricsCards({ bookings = [], totalSlotsCount = 32, defaultExpanded = false }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Filtrar apenas reservas confirmadas
  const activeBookings = bookings.filter((b) => b.status !== 'cancelled');

  // Faturamento total do dia
  const totalRevenue = activeBookings.reduce((sum, b) => {
    const val = parseFloat(b.total_price || 140);
    return sum + (isNaN(val) ? 140 : val);
  }, 0);

  // Contagem Balcão vs App
  const manualCount = activeBookings.filter((b) => b.is_manual).length;
  const appCount = activeBookings.length - manualCount;

  // Taxa de ocupação (%)
  const occupancyPercentage = totalSlotsCount > 0
    ? Math.min(100, Math.round((activeBookings.length / totalSlotsCount) * 100))
    : 0;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Resumo Retrátil / Collapsible Header Bar */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setExpanded(!expanded)}
        style={styles.summaryBar}
      >
        <View style={styles.summaryLeft}>
          <BarChart3 size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>
            Faturamento & Métricas:
          </Text>
          <Text style={[styles.summaryHighlight, { color: colors.success }]}>
            R$ {totalRevenue.toFixed(0)}
          </Text>
          <Text style={[styles.summaryBadge, { color: colors.textMuted }]}>
            • {occupancyPercentage}% Ocupado
          </Text>
        </View>

        <View style={styles.summaryRight}>
          <Text style={[styles.toggleText, { color: colors.primary }]}>
            {expanded ? 'Ocultar' : 'Ver Detalhes'}
          </Text>
          {expanded ? (
            <ChevronUp size={16} color={colors.primary} />
          ) : (
            <ChevronDown size={16} color={colors.primary} />
          )}
        </View>
      </TouchableOpacity>

      {/* Cards de Métricas expandidos */}
      {expanded ? (
        <View style={[styles.metricsContainer, { borderTopColor: colors.border }]}>
          {/* Card 1: Faturamento do Dia */}
          <View style={[styles.metricCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.metricHeaderRow}>
              <Text style={[styles.metricTitle, { color: colors.textMuted }]}>Faturamento Estimado</Text>
              <View style={[styles.iconCircle, { backgroundColor: colors.successSurface }]}>
                <DollarSign size={15} color={colors.success} />
              </View>
            </View>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.metricSubtext, { color: colors.success }]}>
              {activeBookings.length} reservas ativas
            </Text>
          </View>

          {/* Card 2: Taxa de Ocupação */}
          <View style={[styles.metricCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.metricHeaderRow}>
              <Text style={[styles.metricTitle, { color: colors.textMuted }]}>Taxa de Ocupação</Text>
              <View style={[styles.iconCircle, { backgroundColor: colors.infoSurface }]}>
                <TrendingUp size={15} color={colors.info} />
              </View>
            </View>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{occupancyPercentage}%</Text>
            <Text style={[styles.metricSubtext, { color: colors.info }]}>
              {activeBookings.length} de {totalSlotsCount} slots
            </Text>
          </View>

          {/* Card 3: Origem das Reservas */}
          <View style={[styles.metricCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.metricHeaderRow}>
              <Text style={[styles.metricTitle, { color: colors.textMuted }]}>Balcão vs App</Text>
              <View style={[styles.iconCircle, { backgroundColor: colors.holdingSurface }]}>
                <Users size={15} color={colors.holding} />
              </View>
            </View>
            <View style={styles.ratioRow}>
              <View style={styles.ratioItem}>
                <Store size={13} color={colors.holding} style={{ marginRight: 2 }} />
                <Text style={[styles.ratioText, { color: colors.holding }]}>{manualCount} Balcão</Text>
              </View>
              <Text style={[styles.ratioSeparator, { color: colors.textMuted }]}>•</Text>
              <View style={styles.ratioItem}>
                <Smartphone size={13} color={colors.info} style={{ marginRight: 2 }} />
                <Text style={[styles.ratioText, { color: colors.info }]}>{appCount} App</Text>
              </View>
            </View>
            <Text style={[styles.metricSubtext, { color: colors.textMuted }]}>Origem no dia</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  summaryLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginRight: 6,
  },
  summaryTitle: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '700',
    marginRight: 4,
  },
  summaryHighlight: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '800',
    marginRight: 4,
  },
  summaryBadge: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
  summaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  toggleText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
    borderTopWidth: 1,
  },
  metricCard: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: '47%',
    minWidth: 130,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.sm,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricSubtext: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
  ratioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 4,
  },
  ratioItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratioText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '800',
  },
  ratioSeparator: {
    fontSize: theme.typography.sizes.caption,
  },
});
