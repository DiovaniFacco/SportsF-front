import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { theme } from '../styles/theme';
import { getVenues } from '../api/venues';
import { Header } from '../components/common/Header';
import { SportChip } from '../components/common/SportChip';
import { ComplexCard } from '../components/complexes/ComplexCard';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { BottomNav } from '../components/common/BottomNav';

export function ComplexesScreen({ onSelectVenue, onOpenAuth, onOpenManager, activeTab = 'explorar', onTabChange }) {
  const { colors } = useTheme();
  const [searchValue, setSearchValue] = useState('');
  const [selectedSport, setSelectedSport] = useState('Todos');

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const handleTabChange = (tabId) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else if (tabId === 'gestao' && onOpenManager) {
      onOpenManager();
    }
  };

  const fetchVenuesData = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setError(null);

      try {
        const data = await getVenues({
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
    [selectedSport, searchValue]
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

    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.mainWrapper}>
        <FlatList
          data={loading || error ? [] : venues}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.cardPadding}>
              <ComplexCard venue={item} onPress={handleCardPress} />
            </View>
          )}
          ListHeaderComponent={
            <View style={styles.headerWrapper}>
              <Header
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                onOpenAuth={onOpenAuth}
                onOpenManager={onOpenManager}
              />
              <SportChip
                selectedSport={selectedSport}
                onSelectSport={setSelectedSport}
              />
            </View>
          }
          ListEmptyComponent={renderContent}
          contentContainerStyle={styles.listContainerStyle}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      </View>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
  },
  headerWrapper: {
    width: '100%',
    marginBottom: theme.spacing.xs,
  },
  cardPadding: {
    paddingHorizontal: theme.spacing.md,
  },
  listPadding: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  listContainerStyle: {
    paddingBottom: theme.spacing.xl,
  },
});

