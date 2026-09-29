import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  User,
  Calendar,
  ArrowRight,
  LogOut,
  Edit3,
  Building2,
  HelpCircle,
  Phone,
  Mail,
  ShieldCheck,
  Trophy,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';
import { getUserBookings } from '../api/bookings';
import { parseServerDateTime } from '../utils/datetime';
import { BottomNav } from '../components/common/BottomNav';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { ErrorState } from '../components/common/ErrorState';

export function ProfileScreen({ onTabChange, onGoToExplore, onOpenAuth, onOpenManager }) {
  const { colors } = useTheme();
  const { user, isAuthenticated, isManager, logout, updateProfile } = useAuth();

  // Bookings state for stats
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState(null);

  // Profile Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Help Modal State
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Fetch bookings summary
  const fetchBookingsSummary = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingBookings(true);
    setBookingsError(null);
    try {
      const response = await getUserBookings();
      const list = Array.isArray(response) ? response : response.data || [];
      setBookings(list);
    } catch (err) {
      console.warn('Erro ao carregar resumo de agendamentos:', err);
      setBookingsError('Não conseguimos carregar seu resumo. Verifique sua conexão.');
    } finally {
      setLoadingBookings(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchBookingsSummary();
  }, [fetchBookingsSummary]);

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Atenção', 'O nome não pode ficar em branco.');
      return;
    }

    setUpdatingProfile(true);
    try {
      await updateProfile({
        name: editName.trim(),
        phone: editPhone.trim() || null,
      });
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      setIsEditModalOpen(false);
    } catch (err) {
      Alert.alert('Erro', err.message || 'Erro ao atualizar dados do perfil.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleLogoutConfirm = () => {
    const doLogout = async () => {
      try {
        await logout();
      } catch (e) {
        console.warn('Erro ao efetuar logout:', e);
      } finally {
        if (onOpenAuth) {
          onOpenAuth();
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

  // Calculations for stats
  const now = new Date();
  const upcomingCount = bookings.filter((b) => {
    const isCancelled = b.status === 'cancelled';
    const startDate = b.start_time ? parseServerDateTime(b.start_time) : null;
    return startDate && startDate > now && !isCancelled;
  }).length;

  // User Initials
  const getUserInitials = () => {
    if (!user?.name) return 'SF';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  // Role Badge Label
  const getRoleLabel = () => {
    const role = user?.role?.toUpperCase();
    if (role === 'ADMIN') return 'Administrador';
    if (role === 'GESTOR_ESPACO' || role === 'GESTOR') return 'Gestor de Espaço';
    return 'Atleta';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.mainWrapper}>
        {/* Top Screen Header */}
        <View style={[styles.topHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.topHeaderTitle, { color: colors.textPrimary }]}>Meu Perfil</Text>
        </View>

        <ScrollView contentContainerStyle={styles.paddingContainer} showsVerticalScrollIndicator={false}>
          {!isAuthenticated ? (
            /* Unauthenticated View */
            <View style={[styles.authCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.authIconCircle, { backgroundColor: colors.primaryLight }]}>
                <User size={36} color={colors.primary} />
              </View>
              <Text style={[styles.authTitle, { color: colors.textPrimary }]}>
                Acesse seu Perfil
              </Text>
              <Text style={[styles.authMessage, { color: colors.textSecondary }]}>
                Faça login para consultar seus agendamentos, alterar seus dados pessoais e gerenciar suas reservas no SportsF.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.authButton, { backgroundColor: colors.primary }]}
                onPress={onOpenAuth}
              >
                <Text style={styles.authButtonText}>Fazer Login ou Cadastrar</Text>
                <ArrowRight size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            /* Authenticated Profile View */
            <View>
              {/* User Profile Card */}
              <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.userCardTop}>
                  <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>{getUserInitials()}</Text>
                  </View>

                  <View style={styles.userInfoCol}>
                    <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {user?.name || 'Atleta SportsF'}
                    </Text>
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                      {user?.email || 'email@exemplo.com'}
                    </Text>

                    {user?.phone ? (
                      <View style={styles.phoneRow}>
                        <Phone size={12} color={colors.textMuted} />
                        <Text style={[styles.userPhone, { color: colors.textMuted }]}>{user.phone}</Text>
                      </View>
                    ) : null}

                    <View style={[styles.roleBadge, { backgroundColor: colors.primaryLight }]}>
                      <ShieldCheck size={12} color={colors.primary} />
                      <Text style={[styles.roleBadgeText, { color: colors.primary }]}>{getRoleLabel()}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.75}
                    style={[styles.editProfileBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                    onPress={() => setIsEditModalOpen(true)}
                    accessibilityLabel="Editar Perfil"
                  >
                    <Edit3 size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Stats Dashboard Grid */}
              {loadingBookings ? (
                <SkeletonCard />
              ) : bookingsError ? (
                <ErrorState message={bookingsError} onRetry={fetchBookingsSummary} />
              ) : (
              <View style={styles.statsGrid}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => onTabChange('agendamentos')}
                >
                  <View style={[styles.statIconBg, { backgroundColor: colors.primaryLight }]}>
                    <Trophy size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{bookings.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Agendamentos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => onTabChange('agendamentos')}
                >
                  <View style={[styles.statIconBg, { backgroundColor: colors.successSurface }]}>
                    <Sparkles size={18} color={colors.success} />
                  </View>
                  <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{upcomingCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Próximos Jogos</Text>
                </TouchableOpacity>

                <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.statIconBg, { backgroundColor: colors.warningSurface }]}>
                    <ShieldCheck size={18} color={colors.gold} />
                  </View>
                  <Text style={[styles.statNumber, { color: colors.textPrimary }]}>Ativa</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Conta Verificada</Text>
                </View>
              </View>
              )}

              {/* Options & Shortcuts List */}
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Menu do Perfil</Text>

              <View style={styles.actionsList}>
                {/* Botão de Meus Agendamentos -> redireciona para MyBookingsScreen */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionRowBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => onTabChange('agendamentos')}
                >
                  <View style={styles.actionRowLeft}>
                    <View style={[styles.actionIconCircle, { backgroundColor: colors.primaryLight }]}>
                      <Calendar size={18} color={colors.primary} />
                    </View>
                    <View style={styles.actionTextCol}>
                      <View style={styles.actionTitleRow}>
                        <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Meus Agendamentos</Text>
                        {upcomingCount > 0 ? (
                          <View style={[styles.badgeCount, { backgroundColor: colors.primary }]}>
                            <Text style={styles.badgeCountText}>{upcomingCount}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                        Visualizar e gerenciar histórico de reservas
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Botão Painel de Gestão (para Gestor / Admin) */}
                {isManager ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.actionRowBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={onOpenManager}
                  >
                    <View style={styles.actionRowLeft}>
                      <View style={[styles.actionIconCircle, { backgroundColor: colors.primaryLight }]}>
                        <Building2 size={18} color={colors.primary} />
                      </View>
                      <View style={styles.actionTextCol}>
                        <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Painel de Gestão</Text>
                        <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                          Gerenciar complexos, quadras e horários
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}

                {/* Botão Editar Perfil */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionRowBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setIsEditModalOpen(true)}
                >
                  <View style={styles.actionRowLeft}>
                    <View style={[styles.actionIconCircle, { backgroundColor: colors.backgroundSecondary }]}>
                      <Edit3 size={18} color={colors.primary} />
                    </View>
                    <View style={styles.actionTextCol}>
                      <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Editar Perfil</Text>
                      <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                        Alterar seu nome e telefone de contato
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Botão Ajuda & Suporte */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionRowBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setIsHelpModalOpen(true)}
                >
                  <View style={styles.actionRowLeft}>
                    <View style={[styles.actionIconCircle, { backgroundColor: colors.backgroundSecondary }]}>
                      <HelpCircle size={18} color={colors.primary} />
                    </View>
                    <View style={styles.actionTextCol}>
                      <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Ajuda e Suporte</Text>
                      <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                        Dúvidas frequentes e canais de atendimento
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Botão Sair da Conta */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionRowBtn, { backgroundColor: colors.errorSurface, borderColor: colors.error }]}
                  onPress={handleLogoutConfirm}
                >
                  <View style={styles.actionRowLeft}>
                    <View style={[styles.actionIconCircle, { backgroundColor: colors.errorSurface }]}>
                      <LogOut size={18} color={colors.error} />
                    </View>
                    <View style={styles.actionTextCol}>
                      <Text style={[styles.actionTitle, { color: colors.error }]}>Sair da Conta</Text>
                      <Text style={[styles.actionSubtitle, { color: colors.error }]}>Encerrar sessão com segurança</Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Modal Editar Perfil */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent onRequestClose={() => setIsEditModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Editar Perfil</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setIsEditModalOpen(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nome Completo</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: colors.searchBg, borderColor: colors.border, color: colors.textPrimary }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Seu nome"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>Telefone / WhatsApp</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: colors.searchBg, borderColor: colors.border, color: colors.textPrimary }]}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setIsEditModalOpen(false)}
                disabled={updatingProfile}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveProfile}
                disabled={updatingProfile}
              >
                {updatingProfile ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalSaveText}>Salvar Alterações</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Central de Ajuda */}
      <Modal visible={isHelpModalOpen} animationType="fade" transparent onRequestClose={() => setIsHelpModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Ajuda & Suporte</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setIsHelpModalOpen(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.helpIntro, { color: colors.textSecondary }]}>
                Precisa de auxílio com alguma reserva ou possui dúvidas sobre o aplicativo SportsF?
              </Text>

              <View style={[styles.supportItem, { backgroundColor: colors.backgroundSecondary }]}>
                <Mail size={20} color={colors.primary} />
                <View>
                  <Text style={[styles.supportItemTitle, { color: colors.textPrimary }]}>E-mail de Suporte</Text>
                  <Text style={[styles.supportItemValue, { color: colors.textSecondary }]}>suporte@sportsf.com.br</Text>
                </View>
              </View>

              <View style={[styles.supportItem, { backgroundColor: colors.backgroundSecondary, marginTop: 10 }]}>
                <Phone size={20} color={colors.primary} />
                <View>
                  <Text style={[styles.supportItemTitle, { color: colors.textPrimary }]}>Atendimento via WhatsApp</Text>
                  <Text style={[styles.supportItemValue, { color: colors.textSecondary }]}>+55 (55) 99999-8888</Text>
                </View>
              </View>

              <View style={[styles.versionBox, { borderColor: colors.border }]}>
                <Text style={[styles.versionText, { color: colors.textMuted }]}>SportsF v1.0.0 — Todos os direitos reservados</Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.modalSaveBtn, { backgroundColor: colors.primary, width: '100%' }]}
                onPress={() => setIsHelpModalOpen(false)}
              >
                <Text style={styles.modalSaveText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Navigation Footer Bar */}
      <BottomNav activeTab="perfil" onTabChange={onTabChange} />
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
  topHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  topHeaderTitle: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  paddingContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  userCard: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.subtle,
  },
  userCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  userInfoCol: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  userEmail: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '500',
    marginTop: 1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  userPhone: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '600',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    gap: 4,
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
  },
  editProfileBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: theme.spacing.xs,
  },
  actionsList: {
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.sm + 4,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextCol: {
    flex: 1,
  },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionSubtitle: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '500',
    marginTop: 2,
  },
  badgeCount: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.caption,
    fontWeight: '800',
  },
  authCard: {
    padding: theme.spacing.xl,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  authIconCircle: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  authTitle: {
    fontSize: theme.typography.sizes.h2,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  authMessage: {
    fontSize: theme.typography.sizes.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    gap: 8,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: theme.typography.sizes.button,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 560,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '800',
  },
  modalBody: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '700',
    marginBottom: 4,
  },
  inputField: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  modalCancelText: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '600',
  },
  modalSaveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.label,
    fontWeight: '700',
  },
  helpIntro: {
    fontSize: theme.typography.sizes.label,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: theme.spacing.sm + 2,
    borderRadius: theme.radius.md,
  },
  supportItemTitle: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '700',
  },
  supportItemValue: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '600',
    marginTop: 1,
  },
  versionBox: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  versionText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '500',
  },
});
