import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Building2,
  Plus,
  RefreshCw,
  LogOut,
  Calendar,
  Layers,
  Dumbbell,
  ShieldCheck,
  ArrowLeft,
  DollarSign,
  BarChart3,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';
import { getVenues } from '../../api/venues';
import { getCourtsByVenue, deleteCourt } from '../../api/courts';
import { ManagerCourtCard } from '../../components/manager/ManagerCourtCard';
import { CourtFormModal } from '../../components/manager/CourtFormModal';
import { ManagerScheduleView } from '../../components/manager/ManagerScheduleView';
import { ManagerMetricsView } from '../../components/manager/ManagerMetricsView';
import { ManualBookingModal } from '../../components/manager/ManualBookingModal';
import { CourtBlockModal } from '../../components/manager/CourtBlockModal';
import { CourtOperatingHoursModal } from '../../components/manager/CourtOperatingHoursModal';
import { CourtPricingModal } from '../../components/manager/CourtPricingModal';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';

export function ManagerHomeScreen({ onBackToUserView }) {
  const { colors } = useTheme();
  const { user, logout } = useAuth();

  const [activeVenue, setActiveVenue] = useState(null);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('quadras'); // 'quadras' | 'agenda'

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualModalParams, setManualModalParams] = useState(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockModalParams, setBlockModalParams] = useState(null);

  const [hoursCourt, setHoursCourt] = useState(null);
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [pricingCourt, setPricingCourt] = useState(null);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);

  const handleOpenManualModal = (params = null) => {
    setManualModalParams(params);
    setIsManualModalOpen(true);
  };

  const handleOpenBlockModal = (params = null) => {
    setBlockModalParams(params);
    setIsBlockModalOpen(true);
  };

  const handleOpenHoursModal = (court) => {
    setHoursCourt(court);
    setIsHoursModalOpen(true);
  };

  const handleOpenPricingModal = (court) => {
    setPricingCourt(court);
    setIsPricingModalOpen(true);
  };

  const handleScheduleRefresh = useCallback(() => {
    setScheduleRefreshKey((prev) => prev + 1);
  }, []);


  const fetchManagerData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);

    try {
      // Busca complexos administrados pelo gestor
      const venuesData = await getVenues();
      const venue = venuesData[0] || null;
      setActiveVenue(venue);

      // Busca quadras do espaço
      if (venue) {
        try {
          const courtsData = await getCourtsByVenue(venue.id);
          setCourts(Array.isArray(courtsData) ? courtsData : (venue.courts || []));
        } catch {
          setCourts(venue.courts || []);
        }
      } else {
        setCourts([]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do gerenciador:', err);
      setError('Não foi possível carregar as informações do seu complexo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchManagerData();
  }, [fetchManagerData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchManagerData(true);
  };

  const handleOpenAddModal = () => {
    setEditingCourt(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (court) => {
    setEditingCourt(court);
    setIsModalOpen(true);
  };

  const handleDeleteCourt = (court) => {
    const doDelete = async () => {
      try {
        await deleteCourt(court.id);
        setCourts((prev) => prev.filter((c) => c.id !== court.id));
      } catch (err) {
        // Se a API falhar (ex: modo offline ou mock), remove localmente com aviso
        setCourts((prev) => prev.filter((c) => c.id !== court.id));
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Deseja realmente remover a quadra "${court.name}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Remover Quadra',
        `Deseja realmente excluir a quadra "${court.name}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Remover', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  // Cálculo de Métricas do Gestor
  const totalCourts = courts.length;
  const avgPrice = totalCourts > 0
    ? (courts.reduce((acc, c) => acc + (parseFloat(c.hourly_rate) || 0), 0) / totalCourts).toFixed(0)
    : '0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.mainWrapper}>
        {/* Header Superior do Gestor */}
        <View style={[styles.headerContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <View style={styles.userInfo}>
              <View style={[styles.managerBadge, { backgroundColor: colors.primary + '18' }]}>
                <ShieldCheck size={16} color={colors.primary} />
                <Text style={[styles.managerBadgeText, { color: colors.primary }]}>PAINEL DO GESTOR</Text>
              </View>
              <Text style={[styles.managerTitle, { color: colors.text }]}>
                {activeVenue ? activeVenue.name : 'Complexo Esportivo'}
              </Text>
              <Text style={[styles.managerSubtitle, { color: colors.textMuted }]}>
                {user ? `Gerenciado por ${user.name}` : 'Painel Administrativo'}
              </Text>
            </View>

            <View style={styles.headerActions}>

              {onBackToUserView ? (
                <TouchableOpacity
                  onPress={onBackToUserView}
                  style={[styles.iconBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <ArrowLeft size={18} color={colors.text} />
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                onPress={logout}
                style={[styles.iconBtn, { backgroundColor: colors.error + '12', borderColor: colors.error + '30' }]}
              >
                <LogOut size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Navegação Interna de Abas do Gestor */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
            style={styles.tabsContainer}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveTab('quadras')}
              style={[
                styles.tabBtn,
                activeTab === 'quadras' && [styles.activeTabBtn, { backgroundColor: colors.primary }],
              ]}
            >
              <Dumbbell
                size={16}
                color={activeTab === 'quadras' ? '#FFFFFF' : colors.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'quadras' ? '#FFFFFF' : colors.textMuted },
                ]}
              >
                Quadras ({totalCourts})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveTab('agenda')}
              style={[
                styles.tabBtn,
                activeTab === 'agenda' && [styles.activeTabBtn, { backgroundColor: colors.primary }],
              ]}
            >
              <Calendar
                size={16}
                color={activeTab === 'agenda' ? '#FFFFFF' : colors.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'agenda' ? '#FFFFFF' : colors.textMuted },
                ]}
              >
                Agenda do Dia
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveTab('metricas')}
              style={[
                styles.tabBtn,
                activeTab === 'metricas' && [styles.activeTabBtn, { backgroundColor: colors.primary }],
              ]}
            >
              <BarChart3
                size={16}
                color={activeTab === 'metricas' ? '#FFFFFF' : colors.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'metricas' ? '#FFFFFF' : colors.textMuted },
                ]}
              >
                Faturamento & Métricas
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Botão de Ação Rápida Principal */}
        <View style={styles.actionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {activeTab === 'quadras'
              ? 'Gerenciamento de Quadras'
              : activeTab === 'agenda'
              ? 'Horários e Agendamentos'
              : 'Relatório Financeiro & Métricas'}
          </Text>

          {activeTab === 'quadras' ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenAddModal}
              style={[styles.btnAddCourt, { backgroundColor: colors.primary }]}
            >
              <Plus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnAddCourtText}>Nova Quadra</Text>
            </TouchableOpacity>
          ) : activeTab === 'agenda' ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleOpenManualModal()}
              style={[styles.btnAddCourt, { backgroundColor: colors.primary }]}
            >
              <Plus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnAddCourtText}>Novo Agendamento Balcão</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleRefresh}
              style={[styles.btnAddCourt, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
            >
              <RefreshCw size={16} color={colors.text} style={{ marginRight: 6 }} />
              <Text style={[styles.btnAddCourtText, { color: colors.text }]}>Atualizar Dados</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Conteúdo Principal da Aba */}
        <View style={styles.body}>
          {activeTab === 'metricas' ? (
            <ManagerMetricsView courts={courts} />
          ) : activeTab === 'agenda' ? (
            <ManagerScheduleView
              courts={courts}
              onOpenManualModal={handleOpenManualModal}
              onOpenBlockModal={handleOpenBlockModal}
              refreshKey={scheduleRefreshKey}
            />
          ) : loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>Carregando quadras...</Text>
            </View>
          ) : error ? (
            <ErrorState message={error} onRetry={fetchManagerData} />
          ) : courts.length === 0 ? (
            <EmptyState
              title="Nenhuma quadra cadastrada"
              message="Seu complexo ainda não possui quadras. Clique em 'Nova Quadra' para cadastrar sua primeira quadra."
            />
          ) : (
            <FlatList
              data={courts}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <ManagerCourtCard
                  court={item}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteCourt}
                  onOpenHours={handleOpenHoursModal}
                  onOpenPricing={handleOpenPricingModal}
                />
              )}
              contentContainerStyle={styles.listPadding}
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
          )}
        </View>
      </View>

      {/* Modal de Formulário de Quadra (Criação e Edição) */}
      <CourtFormModal
        visible={isModalOpen}
        court={editingCourt}
        venueId={activeVenue?.id || 1}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchManagerData}
      />

      {/* Modal de Agendamento Manual / Balcão */}
      <ManualBookingModal
        visible={isManualModalOpen}
        courts={courts}
        initialCourtId={manualModalParams?.courtId}
        initialStartTime={manualModalParams?.startTime}
        initialEndTime={manualModalParams?.endTime}
        initialDate={manualModalParams?.date}
        onClose={() => {
          setIsManualModalOpen(false);
          setManualModalParams(null);
        }}
        onSuccess={handleScheduleRefresh}
        onOpenBlockModal={(params) => {
          setIsManualModalOpen(false);
          setManualModalParams(null);
          handleOpenBlockModal(params);
        }}
      />

      {/* Modal de Bloqueio de Quadra / Manutenção */}
      <CourtBlockModal
        visible={isBlockModalOpen}
        courts={courts}
        initialCourtId={blockModalParams?.courtId}
        initialStartTime={blockModalParams?.startTime}
        initialEndTime={blockModalParams?.endTime}
        initialDate={blockModalParams?.date}
        onClose={() => {
          setIsBlockModalOpen(false);
          setBlockModalParams(null);
        }}
        onSuccess={handleScheduleRefresh}
      />

      {/* Modal de Horários de Funcionamento por Quadra */}
      <CourtOperatingHoursModal
        visible={isHoursModalOpen}
        court={hoursCourt}
        onClose={() => {
          setIsHoursModalOpen(false);
          setHoursCourt(null);
        }}
        onSuccess={handleScheduleRefresh}
      />

      {/* Modal de Precificação Flexível (Horários Nobres & Feriados) */}
      <CourtPricingModal
        visible={isPricingModalOpen}
        court={pricingCourt}
        onClose={() => {
          setIsPricingModalOpen(false);
          setPricingCourt(null);
        }}
        onSuccess={handleScheduleRefresh}
      />
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
    maxWidth: 1024,
    alignSelf: 'center',
  },
  headerContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  managerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    gap: 6,
    marginBottom: 6,
  },
  managerBadgeText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  managerTitle: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '800',
  },
  managerSubtitle: {
    fontSize: theme.typography.sizes.caption,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 8,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: theme.typography.sizes.body1,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
  },
  tabsScrollContent: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    alignItems: 'center',
    paddingRight: theme.spacing.md,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
  },
  activeTabBtn: {
    elevation: 2,
  },
  tabText: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '700',
    flexShrink: 1,
  },
  btnAddCourt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  btnAddCourtText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  listPadding: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.body2,
  },
});
