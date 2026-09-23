import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { theme } from '../styles/theme';
import { getVenueDetails } from '../api/venues';
import { VenueHeroHeader } from '../components/complexes/VenueHeroHeader';
import { CourtCard } from '../components/courts/CourtCard';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { BottomNav } from '../components/common/BottomNav';
import { FilterChip } from '../components/common/FilterChip';
import { isSimplifiedVenue } from '../utils/whatsapp';

export function VenueCourtsScreen({ venueId, venue: venueProp = null, onBack, onSelectCourt, onTabChange, hideBottomNav = false, hideBack = false }) {
  const { colors } = useTheme();
  const [venue, setVenue] = useState(venueProp || null);
  const [loading, setLoading] = useState(!venueProp);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSportFilter, setSelectedSportFilter] = useState('Todas');
  const [activeTab, setActiveTab] = useState('explorar');

  const effectiveVenueId = venueProp?.id || venueId;

  // Se o venue já veio pronto (link direto simplificado), usa direto sem refetch inicial.
  useEffect(() => {
    if (venueProp) {
      setVenue(venueProp);
      setLoading(false);
    }
  }, [venueProp]);

  const fetchVenueDetailsData = useCallback(async (isRefresh = false) => {
    if (!effectiveVenueId) return;
    if (!isRefresh) setLoading(true);
    setError(null);

    try {
      const data = await getVenueDetails(effectiveVenueId);
      setVenue(data);
    } catch (err) {
      console.error('Erro ao carregar detalhes do complexo:', err);
      setError('Não foi possível carregar as quadras deste complexo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [effectiveVenueId]);

  useEffect(() => {
    // Evita refetch desnecessário quando o venue já foi entregue via prop.
    if (venueProp) return;
    fetchVenueDetailsData();
  }, [fetchVenueDetailsData, venueProp]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVenueDetailsData(true);
  };

  const handleSelectCourt = (court) => {
    if (onSelectCourt) {
      onSelectCourt(court, venue);
    } else {
      Alert.alert(
        court.name,
        `Superfície: ${court.surface}\nValor/hora: R$ ${Math.round(court.hourly_rate)}`,
        [{ text: 'Entendido', style: 'default' }]
      );
    }
  };

  const courtsList = venue?.courts || [];
  const availableSportsFilters = ['Todas', ...new Set(courtsList.map((c) => c.type))];

  const filteredCourts = selectedSportFilter === 'Todas'
    ? courtsList
    : courtsList.filter((c) => c.type === selectedSportFilter);

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.paddingContainer}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.paddingContainer}>
          <ErrorState message={error} onRetry={() => fetchVenueDetailsData()} />
        </View>
      );
    }

    if (!venue || filteredCourts.length === 0) {
      return (
        <View style={styles.paddingContainer}>
          {venue ? <VenueHeroHeader venue={venue} onBack={hideBack ? null : onBack} hideBack={hideBack} /> : null}
          <EmptyState
            title="Nenhuma quadra encontrada"
            message={`Não encontramos nenhuma quadra cadastrada para a modalidade "${selectedSportFilter}".`}
            onResetFilters={() => setSelectedSportFilter('Todas')}
          />
        </View>
      );
    }

    return (
      <FlatList
        data={filteredCourts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <CourtCard court={item} onSelectCourt={handleSelectCourt} />
        )}
        contentContainerStyle={styles.paddingContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerWrapper}>
            {/* Hero Cover & Details Banner */}
            <VenueHeroHeader venue={venue} onBack={hideBack ? null : onBack} hideBack={hideBack} />

            {/* Section Title Header for Available Courts */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quadras disponíveis</Text>
                <View style={[styles.countBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.countBadgeText, { color: colors.primary }]}>
                    {filteredCourts.length} {filteredCourts.length === 1 ? 'quadra' : 'quadras'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                {isSimplifiedVenue(venue)
                  ? 'Toque em uma quadra para consultar os horários. A confirmação é feita pelo WhatsApp.'
                  : 'Escolha a quadra ideal para ver os horários de agendamento.'}
              </Text>

              {/* Sports Category Filter Chips */}
              {availableSportsFilters.length > 1 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterScroll}
                  contentContainerStyle={styles.filterScrollContent}
                >
                  {availableSportsFilters.map((filter) => (
                    <FilterChip
                      key={filter}
                      label={filter}
                      isSelected={selectedSportFilter === filter}
                      onPress={() => setSelectedSportFilter(filter)}
                    />
                  ))}
                </ScrollView>
              ) : null}
            </View>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Main Body */}
      <View style={styles.body}>{renderContent()}</View>

      {/* Mobile Bottom Navigation — oculta no acesso exclusivo do modo Simplificado */}
      {!hideBottomNav && !isSimplifiedVenue(venue) ? (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab === 'explorar') {
              onBack();
            } else if (onTabChange) {
              onTabChange(tab);
            } else {
              setActiveTab(tab);
            }
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
    width: '100%',
    maxWidth: 1024,
    alignSelf: 'center',
  },
  paddingContainer: {
    paddingBottom: theme.spacing.xl,
  },
  headerWrapper: {
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: theme.typography.sizes.bodySmall,
    marginBottom: theme.spacing.sm,
  },
  filterScroll: {
    marginVertical: 4,
  },
  filterScrollContent: {
    gap: 8,
    paddingRight: theme.spacing.md,
    paddingVertical: 6,
  },
});