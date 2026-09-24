import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import {
  Building2,
  Plus,
  LogOut,
  Calendar,
  ClipboardList,
  Dumbbell,
  ShieldCheck,
  ArrowLeft,
  BarChart3,
  Edit3,
  Trash2,
  MoreVertical,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';
import { getVenues, deleteVenue } from '../../api/venues';
import { getCourtsByVenue, deleteCourt } from '../../api/courts';
import { ManagerCourtCard } from '../../components/manager/ManagerCourtCard';
import { CourtFormModal } from '../../components/manager/CourtFormModal';
import { VenueFormModal } from '../../components/manager/VenueFormModal';
import { ManagerScheduleView } from '../../components/manager/ManagerScheduleView';
import { ManagerMetricsView } from '../../components/manager/ManagerMetricsView';
import { ManagerBookingsView } from '../../components/manager/ManagerBookingsView';
import { ManualBookingModal } from '../../components/manager/ManualBookingModal';
import { CourtBlockModal } from '../../components/manager/CourtBlockModal';
import { CourtOperatingHoursModal } from '../../components/manager/CourtOperatingHoursModal';
import { CourtPricingModal } from '../../components/manager/CourtPricingModal';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';

export function ManagerHomeScreen({ onBackToUserView }) {
  const { colors } = useTheme();
  const { user, logout } = useAuth();

  const isAdmin =
    user?.role?.toUpperCase() === 'ADMIN' ||
    user?.role?.toUpperCase() === 'ADMINISTRADOR' ||
    user?.isAdmin === true ||
    user?.is_admin === true;

  const [allVenues, setAllVenues] = useState([]);
  const [activeVenue, setActiveVenue] = useState(null);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('metricas'); // 'quadras' | 'agenda' | 'agendamentos' | 'metricas'
  const [managerMenuOpen, setManagerMenuOpen] = useState(false);
  const menuBtnRef = useRef(null);
  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const openManagerMenu = () => {
    if (menuBtnRef.current?.measureInWindow) {
      menuBtnRef.current.measureInWindow((x, y, width, height) => {
        setMenuAnchor({ x, y, width, height });
        setManagerMenuOpen(true);
      });
    } else {
      setManagerMenuOpen(true);
    }
  };

  // Venue Modal States
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);

  // Court Modal States
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

  const fetchManagerData = useCallback(async (isRefresh = false, selectedVenueId = null) => {
    if (!isRefresh) setLoading(true);
    setError(null);

    try {
      // Busca complexos esportivos
      const rawVenues = await getVenues();
      const venuesData = isAdmin
        ? rawVenues
        : rawVenues.filter((v) => v.user_id === user?.id || v.user?.id === user?.id || v.owner?.id === user?.id);
      setAllVenues(venuesData);

      let venueToSelect = null;
      if (selectedVenueId) {
        venueToSelect = venuesData.find((v) => v.id === selectedVenueId) || venuesData[0];
      } else {
        venueToSelect = activeVenue
          ? venuesData.find((v) => v.id === activeVenue.id) || venuesData[0]
          : venuesData[0] || null;
      }

      setActiveVenue(venueToSelect);

      // Busca quadras do espaço selecionado
      if (venueToSelect) {
        try {
          const courtsData = await getCourtsByVenue(venueToSelect.id);
          setCourts(Array.isArray(courtsData) ? courtsData : (venueToSelect.courts || []));
        } catch {
          setCourts(venueToSelect.courts || []);
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
  }, [activeVenue]);

  useEffect(() => {
    fetchManagerData();
  }, []);

  const handleSelectVenue = async (venue) => {
    setActiveVenue(venue);
    setLoading(true);
    try {
      const courtsData = await getCourtsByVenue(venue.id);
      setCourts(Array.isArray(courtsData) ? courtsData : (venue.courts || []));
    } catch {
      setCourts(venue.courts || []);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchManagerData(true);
  };

  // Complex Management Handlers
  const handleOpenAddVenue = () => {
    setEditingVenue(null);
    setIsVenueModalOpen(true);
  };

  const handleOpenEditVenue = (venueToEdit = null) => {
    setEditingVenue(venueToEdit || activeVenue);
    setIsVenueModalOpen(true);
  };

  const handleDeleteVenue = (venueToDelete) => {
    const venue = venueToDelete || activeVenue;
    if (!venue) return;

    const doDelete = async () => {
      try {
        await deleteVenue(venue.id);
        const updatedVenues = allVenues.filter((v) => v.id !== venue.id);
        setAllVenues(updatedVenues);
        const nextVenue = updatedVenues[0] || null;
        setActiveVenue(nextVenue);
        if (nextVenue) {
          handleSelectVenue(nextVenue);
        } else {
          setCourts([]);
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Erro ao excluir complexo.';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('Erro', msg);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Tem certeza que deseja excluir o complexo "${venue.name}"? Esta ação removerá todas as quadras vinculadas!`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Excluir Complexo',
        `Tem certeza que deseja excluir o complexo "${venue.name}"? Esta ação é irreversível e excluirá todas as quadras vinculadas.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: doDelete },
        ]
      );
    }
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

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await logout();
      } catch (e) {
        console.warn('Erro ao efetuar logout:', e);
      } finally {
        if (onBackToUserView) {
          onBackToUserView();
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Tem certeza de que deseja sair da conta?')) {
        doLogout();
      }
    } else {
      Alert.alert('Sair da Conta', 'Tem certeza de que deseja sair?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: doLogout,
        },
      ]);
    }
  };

  // Cálculo de Métricas do Gestor
  const totalCourts = courts.length;
  const avgPrice = totalCourts > 0
    ? (courts.reduce((acc, c) => acc + (parseFloat(c.hourly_rate) || 0), 0) / totalCourts).toFixed(0)
    : '0';

  // Barra fixa compacta do Gestor: fica FORA da rolagem para liberar espaço
  // na agenda em telas pequenas. Ações raras ficam no menu "⋮".
  const renderFixedBar = () => (
    <View style={[styles.headerContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.compactRow}>
        {onBackToUserView ? (
          <TouchableOpacity
            onPress={onBackToUserView}
            style={[styles.iconBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <ArrowLeft size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.compactTitleWrap}>
          <View style={styles.compactTitleRow}>
            <ShieldCheck size={14} color={colors.primary} />
            <Text numberOfLines={1} style={[styles.managerTitle, { color: colors.textPrimary }]}>
              {activeVenue ? activeVenue.name : 'Nenhum Complexo Selecionado'}
            </Text>
          </View>
          <Text numberOfLines={1} style={[styles.managerSubtitle, { color: colors.textMuted }]}>
            {activeVenue?.address
              ? `${activeVenue.address} - ${activeVenue.city}, ${activeVenue.state}`
              : user
              ? `Gerenciado por ${user.name}`
              : 'Painel Administrativo'}
          </Text>
        </View>

        <View style={styles.compactActions}>
          {isAdmin ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenAddVenue}
              style={[styles.iconBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              title="Novo Complexo"
            >
              <Plus size={16} color={colors.white} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            ref={menuBtnRef}
            onPress={openManagerMenu}
            style={[styles.iconBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            title="Mais ações"
          >
            <MoreVertical size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Seletor de Complexos: só ocupa espaço quando há mais de um */}
      {allVenues.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.venuePillScroll}>
          {allVenues.map((v) => {
            const isSelected = activeVenue?.id === v.id;
            return (
              <TouchableOpacity
                key={v.id}
                activeOpacity={0.7}
                onPress={() => handleSelectVenue(v)}
                style={[
                  styles.venuePill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.background,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Building2 size={13} color={isSelected ? colors.white : colors.textMuted} />
                <Text style={[styles.venuePillText, { color: isSelected ? colors.white : colors.textPrimary }]}>
                  {v.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {/* Navegação Interna de Abas do Gestor (sempre visível) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScrollContent}
        style={styles.tabsContainer}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab('metricas')}
          style={[
            styles.tabBtn,
            activeTab === 'metricas' && [styles.activeTabBtn, { backgroundColor: colors.primary }],
          ]}
        >
          <BarChart3
            size={15}
            color={activeTab === 'metricas' ? colors.white : colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'metricas' ? colors.white : colors.textMuted },
            ]}
          >
            Faturamento & Métricas
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
            size={15}
            color={activeTab === 'agenda' ? colors.white : colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'agenda' ? colors.white : colors.textMuted },
            ]}
          >
            Agenda do Dia
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab('agendamentos')}
          style={[
            styles.tabBtn,
            activeTab === 'agendamentos' && [styles.activeTabBtn, { backgroundColor: colors.primary }],
          ]}
        >
          <ClipboardList
            size={15}
            color={activeTab === 'agendamentos' ? colors.white : colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'agendamentos' ? colors.white : colors.textMuted },
            ]}
          >
            Agendamentos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab('quadras')}
          style={[
            styles.tabBtn,
            activeTab === 'quadras' && [styles.activeTabBtn, { backgroundColor: colors.primary }],
          ]}
        >
          <Dumbbell
            size={15}
            color={activeTab === 'quadras' ? colors.white : colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'quadras' ? colors.white : colors.textMuted },
            ]}
          >
            Quadras ({totalCourts})
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // Menu flutuante com as ações menos frequentes do painel
  const renderManagerMenu = () => {
    const items = [];
    if (isAdmin) {
      items.push({
        key: 'add-venue',
        icon: Plus,
        label: 'Novo Complexo',
        onPress: () => {
          setManagerMenuOpen(false);
          handleOpenAddVenue();
        },
      });
    }
    if (activeVenue) {
      items.push({
        key: 'edit-venue',
        icon: Edit3,
        label: 'Editar Complexo',
        onPress: () => {
          setManagerMenuOpen(false);
          handleOpenEditVenue(activeVenue);
        },
      });
    }
    if (isAdmin && activeVenue) {
      items.push({
        key: 'delete-venue',
        icon: Trash2,
        label: 'Excluir Complexo',
        danger: true,
        onPress: () => {
          setManagerMenuOpen(false);
          handleDeleteVenue(activeVenue);
        },
      });
    }
    items.push({
      key: 'logout',
      icon: LogOut,
      label: 'Sair da Conta',
      danger: true,
      onPress: () => {
        setManagerMenuOpen(false);
        handleLogout();
      },
    });

    return (
      <Modal
        transparent
        visible={managerMenuOpen}
        animationType="fade"
        onRequestClose={() => setManagerMenuOpen(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setManagerMenuOpen(false)}>
          <View
            style={[
              styles.menuCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                top: menuAnchor.y + menuAnchor.height + 6,
                right: Math.max(
                  theme.spacing.md,
                  Dimensions.get('window').width - (menuAnchor.x + menuAnchor.width),
                ),
              },
            ]}
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.7}
                  onPress={item.onPress}
                  style={styles.menuItem}
                >
                  <Icon size={16} color={item.danger ? colors.error : colors.textPrimary} />
                  <Text
                    style={[
                      styles.menuItemText,
                      { color: item.danger ? colors.error : colors.textPrimary },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    );
  };

  // Conteúdo leve que rola junto com a lista (apenas a ação contextual da aba;
  // na aba Agenda as ações ficam na barra de ferramentas do ManagerScheduleView
  // e na aba Métricas não há ação — basta recarregar/puxar para atualizar)
  const renderListExtras = () => (
    <View style={styles.actionHeader}>
      {activeTab === 'quadras' && activeVenue ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpenAddModal}
          style={[styles.btnAddCourt, { backgroundColor: colors.primary }]}
        >
          <Plus size={16} color={colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.btnAddCourtText}>Nova Quadra</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.mainWrapper}>
        {/* Barra fixa compacta (não rola) */}
        {renderFixedBar()}

        {/* Conteúdo Principal da Aba */}
        <View style={styles.body}>
          {activeTab === 'metricas' ? (
            <ManagerMetricsView
              courts={courts}
            />
          ) : activeTab === 'agenda' ? (
            <ManagerScheduleView
              courts={courts}
              onOpenManualModal={handleOpenManualModal}
              onOpenBlockModal={handleOpenBlockModal}
              refreshKey={scheduleRefreshKey}
            />
          ) : activeTab === 'agendamentos' ? (
            <ManagerBookingsView
              courts={courts}
              activeVenueId={activeVenue?.id}
              refreshKey={scheduleRefreshKey}
              onChanged={() => {
                handleScheduleRefresh();
                fetchManagerData(true);
              }}
            />
          ) : loading && !refreshing ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderListExtras()}
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Carregando quadras...</Text>
              </View>
            </ScrollView>
          ) : error ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderListExtras()}
              <ErrorState message={error} onRetry={fetchManagerData} />
            </ScrollView>
          ) : !activeVenue ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderListExtras()}
              <View style={{ padding: theme.spacing.lg, alignItems: 'center' }}>
                <EmptyState
                  title="Nenhum complexo cadastrado"
                  message="Você ainda não possui nenhum complexo esportivo cadastrado no sistema."
                />
                {isAdmin ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleOpenAddVenue}
                    style={[styles.btnAddCourt, { backgroundColor: colors.primary, marginTop: theme.spacing.md }]}
                  >
                    <Plus size={18} color={colors.white} style={{ marginRight: 6 }} />
                    <Text style={styles.btnAddCourtText}>Cadastrar Primeiro Complexo</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </ScrollView>
          ) : courts.length === 0 ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderListExtras()}
              <EmptyState
                title="Nenhuma quadra cadastrada"
                message="Seu complexo ainda não possui quadras. Clique em '+ Nova Quadra' para cadastrar sua primeira quadra."
              />
            </ScrollView>
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
              ListHeaderComponent={renderListExtras}
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

      {/* Menu flutuante do painel (ações menos frequentes) */}
      {renderManagerMenu()}

      {/* Modal de Formulário de Complexo Esportivo (Criação e Edição) */}
      <VenueFormModal
        visible={isVenueModalOpen}
        venue={editingVenue}
        onClose={() => {
          setIsVenueModalOpen(false);
          setEditingVenue(null);
        }}
        onSuccess={() => {
          fetchManagerData(true, editingVenue?.id);
        }}
      />

      {/* Modal de Formulário de Quadra (Criação e Edição) */}
      <CourtFormModal
        visible={isModalOpen}
        court={editingCourt}
        venueId={activeVenue?.id || 1}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchManagerData(true);
          handleScheduleRefresh();
        }}
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
        onSuccess={() => {
          fetchManagerData(true);
          handleScheduleRefresh();
        }}
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
        onSuccess={() => {
          fetchManagerData(true);
          handleScheduleRefresh();
        }}
      />

      {/* Modal de Horários de Funcionamento por Quadra */}
      <CourtOperatingHoursModal
        visible={isHoursModalOpen}
        court={hoursCourt}
        onClose={() => {
          setIsHoursModalOpen(false);
          setHoursCourt(null);
        }}
        onSuccess={() => {
          fetchManagerData(true);
          handleScheduleRefresh();
        }}
      />

      {/* Modal de Precificação Flexível (Horários Nobres & Feriados) */}
      <CourtPricingModal
        visible={isPricingModalOpen}
        court={pricingCourt}
        onClose={() => {
          setIsPricingModalOpen(false);
          setPricingCourt(null);
        }}
        onSuccess={() => {
          fetchManagerData(true);
          handleScheduleRefresh();
        }}
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
    maxWidth: 1280,
    alignSelf: 'center',
  },
  headerContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  compactTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  compactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  managerTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '800',
    flexShrink: 1,
  },
  managerSubtitle: {
    fontSize: theme.typography.sizes.caption,
    marginTop: 1,
  },
  compactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  menuCard: {
    position: 'absolute',
    minWidth: 210,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: theme.spacing.xs,
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    gap: 10,
  },
  menuItemText: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '600',
  },
  venuePillScroll: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  venuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    gap: 6,
  },
  venuePillText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
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
    fontSize: theme.typography.sizes.body,
    fontWeight: '700',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  btnAddCourt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  btnAddCourtText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.body,
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
    fontSize: theme.typography.sizes.body,
  },
});
