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
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { theme } from '../styles/theme';
import { getVenueDetails } from '../api/venues';
import { getAvailableSlots } from '../api/slots';
import { VenueHeroHeader } from '../components/complexes/VenueHeroHeader';
import { CourtCard } from '../components/courts/CourtCard';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { BottomNav } from '../components/common/BottomNav';
import { FilterChip } from '../components/common/FilterChip';
import { isSimplifiedVenue } from '../utils/whatsapp';
import { getTodayStrInSaoPaulo } from '../utils/datetime';

const ALL_SPORTS = 'Todas';
const ALL_COVER = 'Todas';

// Grid responsivo: 1 coluna no mobile, 2 em tablets, 3 em telas largas.
function getGridColumns(width) {
  if (width >= 1024) return 3;
  if (width >= 768) return 2;
  return 1;
}

export function VenueCourtsScreen({ venueId, venue: venueProp = null, onBack, onSelectCourt, onTabChange, hideBottomNav = false, hideBack = false }) {
  const { colors } = useTheme();
  const [venue, setVenue] = useState(venueProp || null);
  const [loading, setLoading] = useState(!venueProp);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSportFilter, setSelectedSportFilter] = useState(ALL_SPORTS);
  const [selectedCoverFilter, setSelectedCoverFilter] = useState(ALL_COVER);
  const [availability, setAvailability] = useState({}); // { [courtId]: { freeCount } }
  const [activeTab, setActiveTab] = useState('explorar');
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

  const effectiveVenueId = venueProp?.id || venueId;

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => sub?.remove();
  }, []);

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

  // Disponibilidade de hoje por quadra ("N horários livres hoje").
  const fetchAvailability = useCallback(async (venueData) => {
    const courts = venueData?.courts || [];
    if (courts.length === 0) return;
    const today = getTodayStrInSaoPaulo();
    const results = await Promise.allSettled(
      courts.map(async (court) => {
        const data = await getAvailableSlots(court.id, today);
        const freeSlots = Array.isArray(data?.slots) ? data.slots : [];
        return {
          courtId: court.id,
          freeCount: freeSlots.length,
        };
      })
    );
    const next = {};
    for (const res of results) {
      if (res.status === 'fulfilled') {
        next[res.value.courtId] = { freeCount: res.value.freeCount };
      }
    }
    setAvailability(next);
  }, []);

  useEffect(() => {
    if (venue?.courts?.length) {
      fetchAvailability(venue);
    }
  }, [venue, fetchAvailability]);

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

  // Filtro de modalidade só aparece quando existe mais de uma modalidade no complexo.
  const sportTypes = [...new Set(courtsList.map((c) => c.type).filter(Boolean))];
  const showSportFilter = sportTypes.length > 1;
  const availableSportsFilters = [ALL_SPORTS, ...sportTypes];

  // Quando a modalidade não diferencia (todas iguais), oferece filtro Coberta / Ao ar livre
  // — desde que existam dos dois tipos.
  const coveredCount = courtsList.filter((c) => c.is_covered).length;
  const outdoorCount = courtsList.length - coveredCount;
  const showCoverFilter = !showSportFilter && coveredCount > 0 && outdoorCount > 0;
  const coverFilters = [ALL_COVER, 'Coberta', 'Ao ar livre'];

  let filteredCourts = courtsList;
  if (showSportFilter && selectedSportFilter !== ALL_SPORTS) {
    filteredCourts = filteredCourts.filter((c) => c.type === selectedSportFilter);
  }
  if (showCoverFilter && selectedCoverFilter !== ALL_COVER) {
    filteredCourts = filteredCourts.filter((c) =>
      selectedCoverFilter === 'Coberta' ? c.is_covered : !c.is_covered
    );
  }

  const numColumns = getGridColumns(windowWidth);

  const renderCourt = ({ item }) => (
    <View style={styles.gridCell}>
      <CourtCard
        court={item}
        onSelectCourt={handleSelectCourt}
        availability={availability[item.id] || null}
      />
    </View>
  );

  const renderFilterChips = (filters, selected, onSelect) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterScroll}
      contentContainerStyle={styles.filterScrollContent}
    >
      {filters.map((filter) => (
        <FilterChip
          key={filter}
          label={filter}
          isSelected={selected === filter}
          onPress={() => onSelect(filter)}
        />
      ))}
    </ScrollView>
  );

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
            message={
              venue
                ? 'Não encontramos quadras para os filtros selecionados neste complexo.'
                : 'Não encontramos nenhuma quadra cadastrada neste complexo.'
            }
            onResetFilters={() => {
              setSelectedSportFilter(ALL_SPORTS);
              setSelectedCoverFilter(ALL_COVER);
            }}
          />
        </View>
      );
    }

    return (
      <FlatList
        key={`courts-grid-${numColumns}`}
        data={filteredCourts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCourt}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.gridRow : null}
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

              {/* Filtros: modalidade (se houver mais de uma) e Coberta/Ao ar livre (fallback) */}
              {showSportFilter ? renderFilterChips(availableSportsFilters, selectedSportFilter, setSelectedSportFilter) : null}
              {showCoverFilter ? renderFilterChips(coverFilters, selectedCoverFilter, setSelectedCoverFilter) : null}
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
    maxWidth: 1100,
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
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
  },
  countBadgeText: {
    fontSize: theme.typography.sizes.bodySmall,
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
  gridRow: {
    gap: 0,
  },
  gridCell: {
    flex: 1,
  },
});
