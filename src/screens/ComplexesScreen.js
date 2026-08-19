import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { theme } from '../styles/theme';
import { getVenues } from '../api/venues';
import { Header } from '../components/common/Header';
import { SportChip } from '../components/common/SportChip';
import { ComplexCard } from '../components/complexes/ComplexCard';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { BottomNav } from '../components/common/BottomNav';

export function ComplexesScreen({ onSelectVenue }) {
  const [searchValue, setSearchValue] = useState('');
  const [selectedSport, setSelectedSport] = useState('Todos');
  const [selectedCity, setSelectedCity] = useState('São Paulo, SP');

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('explorar');

  const fetchVenuesData = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setError(null);

      try {
        const data = await getVenues({
          city: selectedCity.split(',')[0].trim(),
          sport: selectedSport,
          search: searchValue,
        });
        setVenues(data);
      } catch (err) {
        console.error('Erro ao carregar complexos:', err);
        setError('Não foi possível carregar os complexos esportivos.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedCity, selectedSport, searchValue]
  );

  useEffect(() => {
    fetchVenuesData();
  }, [fetchVenuesData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVenuesData(true);
  };

  const handleResetFilters = () => {
    setSearchValue('');
    setSelectedSport('Todos');
  };

  const handleCardPress = (venue) => {
    if (onSelectVenue) {
      onSelectVenue(venue);
    }
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.listPadding}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.listPadding}>
          <ErrorState message={error} onRetry={() => fetchVenuesData()} />
        </View>
      );
    }

    if (venues.length === 0) {
      return (
        <View style={styles.listPadding}>
          <EmptyState
            title="Nenhum complexo encontrado"
            message={`Não encontramos nenhum espaço para "${searchValue || selectedSport}". Tente buscar por outros termos ou limpar os filtros.`}
            onResetFilters={handleResetFilters}
          />
        </View>
      );
    }

    return (
      <FlatList
        data={venues}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ComplexCard venue={item} onPress={handleCardPress} />
        )}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />

      {/* Top Header */}
      <Header
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
      />

      {/* Sport Category Filter Chips */}
      <SportChip
        selectedSport={selectedSport}
        onSelectSport={setSelectedSport}
      />

      {/* Main Body List */}
      <View style={styles.body}>{renderContent()}</View>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  body: {
    flex: 1,
    width: '100%',
    maxWidth: 1024,
    alignSelf: 'center',
  },
  listPadding: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
});
