import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, Platform, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import { useFonts, GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { JosefinSans_700Bold } from '@expo-google-fonts/josefin-sans';
import { ComplexesScreen } from './src/screens/ComplexesScreen';
import { VenueCourtsScreen } from './src/screens/VenueCourtsScreen';
import { CourtSlotsScreen } from './src/screens/CourtSlotsScreen';
import { MyBookingsScreen } from './src/screens/MyBookingsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from './src/screens/ResetPasswordScreen';
import { ManagerHomeScreen } from './src/screens/manager/ManagerHomeScreen';
import { BottomNav } from './src/components/common/BottomNav';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { getVenueIdFromUrl, syncVenueUrlInBrowser, getDefaultVenueSlug, getDefaultVenueCandidates, getSubdomainSlug, isGestaoRoute, syncGestaoUrlInBrowser, isResetRoute, getResetParams, clearResetUrlInBrowser } from './src/utils/linking';
import { getVenueDetails, getVenues } from './src/api/venues';
import { isSimplifiedVenue } from './src/utils/whatsapp';
import { initAnalytics, trackAppOpen, trackScreen } from './src/services/analytics';

function MainAppContent() {
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [authScreen, setAuthScreen] = useState(null); // null | 'login' | 'register' | 'forgot' | 'reset'
  const [resetParams, setResetParams] = useState(null); // { token, email } do link de recuperação
  const [isManagerView, setIsManagerView] = useState(false);
  const [activeTab, setActiveTab] = useState('explorar');
  // True quando o app foi aberto diretamente pelo link do complexo (/complexo/slug)
  // ou domínio white-label. Mantido para compatibilidade; o travamento do Simplificado
  // agora vale sempre que o complexo for simplificado (um único cliente no momento).
  const [enteredViaDirectLink, setEnteredViaDirectLink] = useState(false);
  // Splash de boot: em domínio white-label ou /gestao, segura a tela inicial
  // até resolver o roteamento (evita flash da lista + busca duplicada de venues).
  const [bootLoading, setBootLoading] = useState(() => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        return !!getDefaultVenueSlug() || isGestaoRoute(window.location.href) || isResetRoute(window.location.href);
      }
    } catch {
      // ignora e segue sem splash
    }
    return false;
  });
  const { colors } = useTheme();
  const { isStaff, isAuthenticated, isLoading: authLoading } = useAuth();

  // Telemetria de acesso: inicializa os identificadores anônimos e registra a
  // abertura do app. Best-effort — nunca interfere na navegação.
  useEffect(() => {
    initAnalytics().then(() => trackAppOpen());
  }, []);

  // Nome estável da "tela" atual para as métricas de acesso (page views).
  const currentScreen = useMemo(() => {
    if (authScreen) return `auth-${authScreen}`;
    if (isManagerView) return 'gestao';
    if (activeTab === 'perfil') return 'perfil';
    if (activeTab === 'agendamentos') return 'agendamentos';
    if (selectedCourt) return 'quadra-slots';
    if (selectedVenue) return 'complexo';
    return 'explorar';
  }, [authScreen, isManagerView, activeTab, selectedCourt, selectedVenue]);

  const currentVenueId = selectedVenue?.id ?? null;

  // Registra a visualização sempre que a tela muda (ignora o splash de boot).
  useEffect(() => {
    if (bootLoading) return;
    trackScreen(currentScreen, { venueId: currentVenueId });
  }, [currentScreen, currentVenueId, bootLoading]);

  // Modo Simplificado travado: sempre que o complexo for simplificado, o usuário
  // fica apenas na tela do complexo (sem volta para a lista inicial).
  // Vale independente de ter entrado via link direto, subdomínio ou lista —
  // hoje há um único cliente simplificado e ele não deve navegar para outros complexos.
  const simplifiedLock = !!selectedVenue && isSimplifiedVenue(selectedVenue) && !isManagerView;

  // Ref para uso dentro do listener de popstate (evita closure desatualizada).
  const lockRef = useRef({ locked: false, venue: null });
  lockRef.current = { locked: simplifiedLock, venue: selectedVenue };
  // Dedupe do evento 'url' (expo-linking pode reemitir a URL inicial na web).
  const lastHandledRef = useRef({ url: null, at: 0 });

  const handleSelectVenue = (venue) => {
    setSelectedVenue(venue);
    // Em /gestao a URL é própria — não sobrescreve ao trocar de complexo por dentro do painel.
    if (Platform.OS === 'web' && typeof window !== 'undefined' && isGestaoRoute(window.location.href)) {
      return;
    }
    syncVenueUrlInBrowser(venue);
  };

  const handleBackFromVenue = () => {
    // No modo Simplificado, não há volta para a lista de complexos — fica no complexo.
    if (simplifiedLock) return;
    setSelectedVenue(null);
    syncVenueUrlInBrowser(null);
  };

  const openManagerView = () => {
    setIsManagerView(true);
    setAuthScreen(null);
    setResetParams(null);
    syncGestaoUrlInBrowser();
  };

  const closeManagerView = () => {
    setIsManagerView(false);
    setAuthScreen(null);
    // Volta a URL para o contexto atual (complexo aberto ou raiz).
    // Usa force:true porque a URL atual ainda é /gestao.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (lockRef.current.venue) {
          syncVenueUrlInBrowser(lockRef.current.venue, { force: true });
        } else if (isGestaoRoute(window.location.href)) {
          window.history.pushState({}, '', '/');
        }
      } catch {
        // mantém URL atual em caso de falha
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadVenueByIdentifier = async (identifier) => {
      try {
        const venue = await getVenueDetails(identifier);
        if (isMounted && venue) {
          setSelectedVenue(venue);
          setSelectedCourt(null);
          setIsManagerView(false);
          setAuthScreen(null);
          setActiveTab('explorar');
          syncVenueUrlInBrowser(venue);
        }
        return venue;
      } catch (err) {
        console.error('Erro ao carregar complexo do link:', err);
        return null;
      }
    };

    // Rápido: 1 busca de lista + match local + 1 detalhe (sem 404s em sequência).
    // Casa slug/ID exato primeiro; por último, prefixo ("recanto" -> "recanto-beach-...").
    const loadDefaultVenue = async () => {
      try {
        if (!isMounted) return null;
        const wanted = getDefaultVenueCandidates().map((c) => String(c).toLowerCase().trim());
        const sub = (getSubdomainSlug() || '').toLowerCase();
        const list = await getVenues();
        if (!isMounted) return null;
        const norm = (s) => String(s || '').toLowerCase().trim();
        const match =
          list.find((v) => wanted.includes(norm(v.slug)) || wanted.includes(String(v.id))) ||
          (sub
            ? list.find((v) => v.slug === sub) ||
              list.find((v) => v.slug && v.slug.startsWith(`${sub}-`)) ||
              list.find((v) => v.slug && sub.startsWith(v.slug))
            : null);
        if (match) return await loadVenueByIdentifier(match.slug || match.id);
      } catch (err) {
        console.error('Erro ao resolver venue do domínio:', err);
      }
      // Fallback: tentativas diretas (cobre caso fora da lista).
      for (const candidate of getDefaultVenueCandidates()) {
        const venue = await loadVenueByIdentifier(candidate);
        if (venue) return venue;
      }
      return null;
    };

    const handleUrl = async (url, isInitial = false) => {
      // 0. Rota de redefinição de senha: /redefinir-senha?token=…&email=…
      // (link do e-mail de recuperação — mesmo padrão state-based de /gestao).
      if (isResetRoute(url)) {
        const params = getResetParams(url);
        if (isMounted) {
          setResetParams(params);
          setAuthScreen('reset');
          setIsManagerView(false);
        }
        return;
      }

      const gestao = isGestaoRoute(url);
      const venueId = getVenueIdFromUrl(url);

      // 1. Rota de gestão: /gestao (ou /gestao/...) — entra no painel ou cai no login pelo guard.
      if (gestao) {
        if (isMounted) {
          setIsManagerView(true);
          setAuthScreen(null);
          // Se já veio com /complexo/slug junto (ex: /gestao?complex=x), respeita o venue
          // sem sair da gestão (loadVenueByIdentifier desliga isManagerView; religamos após).
          if (venueId) {
            if (isInitial) setEnteredViaDirectLink(true);
            await loadVenueByIdentifier(venueId);
            if (isMounted) {
              setIsManagerView(true);
              setAuthScreen(null);
            }
            syncGestaoUrlInBrowser();
          } else if (isInitial) {
            // Em domínio white-label, carrega o complexo em background (para o "voltar"
            // da gestão cair nele) mas permanece em /gestao.
            if (getDefaultVenueSlug()) {
              setEnteredViaDirectLink(true);
              await loadDefaultVenue();
              if (isMounted) {
                setIsManagerView(true);
                setAuthScreen(null);
              }
            }
            syncGestaoUrlInBrowser();
          } else {
            syncGestaoUrlInBrowser();
          }
        }
        return;
      }

      // 2. Link explícito de complexo (/complexo/slug, ?complex=..., etc) — fluxo atual.
      if (venueId) {
        if (isInitial && isMounted) {
          setEnteredViaDirectLink(true);
        }
        await loadVenueByIdentifier(venueId);
        return;
      }

      // 3. Domínio white-label (recanto.sfacco.com.br/ ou EXPO_PUBLIC_VENUE_SLUG):
      // entra direto no complexo sem precisar de /complexo/slug na URL.
      // Tenta subdomínio e env em sequência — o slug real pode ser maior que o subdomínio
      // (ex: sub "recanto" vs slug "recanto-beach-sports-e-lazer").
      if (getDefaultVenueSlug()) {
        if (isInitial && isMounted) {
          setEnteredViaDirectLink(true);
        }
        await loadDefaultVenue();
        return;
      }

      if (isInitial) {
        // Acesso sem link específico: tela inicial normal (modo completo).
        if (isMounted) setEnteredViaDirectLink(false);
      }
    };

    // Check initial URL on launch
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      lastHandledRef.current = { url: window.location.href, at: Date.now() };
      handleUrl(window.location.href, true).finally(() => {
        if (isMounted) setBootLoading(false);
      });
    } else {
      Linking.getInitialURL()
        .then((url) => {
          if (url) {
            lastHandledRef.current = { url, at: Date.now() };
            return handleUrl(url, true);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setBootLoading(false);
        });
    }

    // Listen to deep link events
    const subscription = Linking.addEventListener('url', (event) => {
      if (!event.url) return;
      const now = Date.now();
      if (event.url === lastHandledRef.current.url && now - lastHandledRef.current.at < 2000) {
        return;
      }
      lastHandledRef.current = { url: event.url, at: now };
      handleUrl(event.url, false);
    });

    // Listen to browser back/forward buttons on Web
    let handlePopState;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      handlePopState = () => {
        const currentHref = window.location.href;
        // Entrando em /redefinir-senha via voltar/avançar do navegador.
        if (isResetRoute(currentHref)) {
          const params = getResetParams(currentHref);
          setResetParams(params);
          setAuthScreen('reset');
          setIsManagerView(false);
          return;
        }
        // Entrando/saindo de /gestao via voltar/avançar do navegador.
        if (isGestaoRoute(currentHref)) {
          setIsManagerView(true);
          setAuthScreen(null);
          return;
        }
        // Saindo de /gestao para outra rota: fecha o painel.
        // (A URL já foi alterada pelo navegador no popstate.)
        setIsManagerView(false);
        const vId = getVenueIdFromUrl(currentHref);
        if (vId) {
          handleUrl(currentHref, false);
        } else {
          // No modo Simplificado travado, impede sair do complexo via voltar do navegador.
          if (lockRef.current.locked && lockRef.current.venue) {
            syncVenueUrlInBrowser(lockRef.current.venue);
            return;
          }
          // Em domínio white-label sem slug na URL, recarrega o complexo padrão
          // em vez de cair na lista geral.
          const fallbackSlug = getDefaultVenueSlug();
          if (fallbackSlug) {
            handleUrl(currentHref, false);
            return;
          }
          setSelectedVenue(null);
        }
      };
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      isMounted = false;
      subscription.remove();
      if (handlePopState) {
        window.removeEventListener('popstate', handlePopState);
      }
    };
  }, []);

  const handleTabChange = (tabId) => {
    // No modo Simplificado travado, o usuário comum não navega para outras
    // abas/complexos. A equipe (gestor/funcionário) pode acessar Gestão,
    // Perfil e Agendamentos sem sair do complexo.
    if (simplifiedLock) {
      if (tabId === 'gestao') {
        openManagerView();
        return;
      }
      if (isStaff && (tabId === 'perfil' || tabId === 'agendamentos' || tabId === 'explorar')) {
        setActiveTab(tabId);
        return;
      }
      return;
    }
    if (tabId === 'gestao') {
      openManagerView();
    } else {
      const wasManager = isManagerView;
      setIsManagerView(false);
      setActiveTab(tabId);
      // Ao sair da gestão pela navegação, restaura a URL do complexo (ou raiz).
      if (wasManager && Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          if (selectedVenue && !isGestaoRoute(window.location.href)) {
            // já está fora de /gestao — garante URL canônica do complexo
            syncVenueUrlInBrowser(selectedVenue);
          } else if (isGestaoRoute(window.location.href)) {
            // ainda em /gestao — força saída para o complexo (ou raiz)
            if (selectedVenue) syncVenueUrlInBrowser(selectedVenue, { force: true });
            else window.history.pushState({}, '', '/');
          }
        } catch {
          // mantém URL atual
        }
      }
    }
  };

  const renderCurrentScreen = () => {
    // Boot em domínio white-label /gestao: splash em vez do flash da lista.
    if (bootLoading && !selectedVenue && !isManagerView) {
      return (
        <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    // MODO SIMPLIFICADO (travado no complexo):
    // sem tela inicial, sem lista/busca de outros complexos,
    // sem botão voltar para a lista. Apenas quadras + horários do complexo
    // + Agendar via WhatsApp (sem criar reserva).
    // A equipe (gestor/funcionário) mantém uma BottomNav para acessar
    // Gestão, Perfil e Agendamentos sem sair do complexo.
    if (simplifiedLock) {
      // Equipe: telas próprias por cima do complexo travado.
      if (isStaff && activeTab === 'perfil') {
        return (
          <ProfileScreen
            onTabChange={handleTabChange}
            onGoToExplore={() => setActiveTab('explorar')}
            onOpenAuth={() => setAuthScreen('login')}
            onOpenManager={openManagerView}
          />
        );
      }
      if (isStaff && activeTab === 'agendamentos') {
        return (
          <MyBookingsScreen
            onTabChange={handleTabChange}
            onGoToExplore={() => setActiveTab('explorar')}
            onOpenAuth={() => setAuthScreen('login')}
          />
        );
      }
      const simplifiedContent = selectedCourt ? (
        <CourtSlotsScreen
          court={selectedCourt}
          venue={selectedVenue}
          onBack={() => setSelectedCourt(null)}
          onOpenAuth={null}
          onTabChange={null}
          hideBottomNav
        />
      ) : (
        <VenueCourtsScreen
          venueId={selectedVenue.id}
          venue={selectedVenue}
          onBack={handleBackFromVenue}
          onSelectCourt={(court, venueObj) => {
            if (venueObj) handleSelectVenue(venueObj);
            setSelectedCourt(court);
          }}
          onTabChange={null}
          hideBottomNav
          hideBack
        />
      );
      if (isStaff) {
        return (
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={{ flex: 1 }}>{simplifiedContent}</View>
            <BottomNav activeTab="explorar" onTabChange={handleTabChange} />
          </View>
        );
      }
      if (selectedCourt) {
        return (
          <CourtSlotsScreen
            court={selectedCourt}
            venue={selectedVenue}
            onBack={() => setSelectedCourt(null)}
            onOpenAuth={null}
            onTabChange={null}
            hideBottomNav
          />
        );
      }
      return (
        <VenueCourtsScreen
          venueId={selectedVenue.id}
          venue={selectedVenue}
          onBack={handleBackFromVenue}
          onSelectCourt={(court, venueObj) => {
            if (venueObj) handleSelectVenue(venueObj);
            setSelectedCourt(court);
          }}
          onTabChange={null}
          hideBottomNav
          hideBack
        />
      );
    }

    if (authScreen === 'login') {
      return (
        <LoginScreen
          onNavigateRegister={() => setAuthScreen('register')}
          onNavigateForgot={() => setAuthScreen('forgot')}
          onBack={() => setAuthScreen(null)}
          onLoginSuccess={() => setAuthScreen(null)}
        />
      );
    }

    if (authScreen === 'register') {
      return (
        <RegisterScreen
          onNavigateLogin={() => setAuthScreen('login')}
          onBack={() => setAuthScreen(null)}
          onRegisterSuccess={() => setAuthScreen(null)}
        />
      );
    }

    if (authScreen === 'forgot') {
      return (
        <ForgotPasswordScreen
          onNavigateLogin={() => setAuthScreen('login')}
          onBack={() => setAuthScreen('login')}
        />
      );
    }

    if (authScreen === 'reset') {
      return (
        <ResetPasswordScreen
          token={resetParams?.token}
          email={resetParams?.email}
          onBack={() => {
            setAuthScreen('login');
            setResetParams(null);
            clearResetUrlInBrowser();
          }}
          onResetSuccess={() => {
            setAuthScreen(null);
            setResetParams(null);
            clearResetUrlInBrowser();
          }}
        />
      );
    }

    if (isManagerView) {
      // Guarda de rota /gestao: logado + equipe (GESTOR/ADMIN/FUNCIONARIO) entra direto,
      // senão cai no login (e após logar o AuthContext re-renderiza para o painel).
      if (authLoading) {
        return (
          <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        );
      }
      if (!isAuthenticated || !isStaff) {
        return (
          <LoginScreen
            onNavigateRegister={() => setAuthScreen('register')}
            onNavigateForgot={() => setAuthScreen('forgot')}
            onBack={closeManagerView}
            onLoginSuccess={() => {
              // Permanece em /gestao; o guard acima libera o painel quando o role for gestor.
              syncGestaoUrlInBrowser();
            }}
          />
        );
      }
      return (
        <ManagerHomeScreen
          onBackToUserView={closeManagerView}
        />
      );
    }

    if (activeTab === 'perfil') {
      return (
        <ProfileScreen
          onTabChange={handleTabChange}
          onGoToExplore={() => setActiveTab('explorar')}
          onOpenAuth={() => setAuthScreen('login')}
          onOpenManager={openManagerView}
        />
      );
    }

    if (activeTab === 'agendamentos') {
      return (
        <MyBookingsScreen
          onTabChange={handleTabChange}
          onGoToExplore={() => setActiveTab('explorar')}
          onOpenAuth={() => setAuthScreen('login')}
        />
      );
    }

    if (selectedCourt) {
      return (
        <CourtSlotsScreen
          court={selectedCourt}
          venue={selectedVenue}
          onBack={() => setSelectedCourt(null)}
          onOpenAuth={() => setAuthScreen('login')}
          onTabChange={handleTabChange}
        />
      );
    }

    if (selectedVenue) {
      return (
        <VenueCourtsScreen
          venueId={selectedVenue.id}
          onBack={handleBackFromVenue}
          onSelectCourt={(court, venueObj) => {
            if (venueObj) handleSelectVenue(venueObj);
            setSelectedCourt(court);
          }}
          onTabChange={handleTabChange}
        />
      );
    }

    return (
      <ComplexesScreen
        onSelectVenue={handleSelectVenue}
        onOpenAuth={() => setAuthScreen('login')}
        onOpenManager={openManagerView}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderCurrentScreen()}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    GreatVibes_400Regular,
    JosefinSans_700Bold,
  });

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const id = 'google-fonts-sportsf';
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Josefin+Sans:wght@700&display=swap';
        document.head.appendChild(link);
      }
    }
  }, []);

  if (!fontsLoaded && Platform.OS !== 'web') {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
