import React, { useState, useEffect, useRef } from 'react';
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
import { ManagerHomeScreen } from './src/screens/manager/ManagerHomeScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { getVenueIdFromUrl, syncVenueUrlInBrowser, getDefaultVenueSlug, getDefaultVenueCandidates, isGestaoRoute, syncGestaoUrlInBrowser } from './src/utils/linking';
import { getVenueDetails } from './src/api/venues';
import { isSimplifiedVenue } from './src/utils/whatsapp';

function MainAppContent() {
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [authScreen, setAuthScreen] = useState(null); // null | 'login' | 'register'
  const [isManagerView, setIsManagerView] = useState(false);
  const [activeTab, setActiveTab] = useState('explorar');
  // True quando o app foi aberto diretamente pelo link do complexo (/complexo/slug).
  // Usado para travar o modo Simplificado sem tela inicial nem navegação para outros complexos.
  const [enteredViaDirectLink, setEnteredViaDirectLink] = useState(false);
  const { colors } = useTheme();
  const { isManager, isAuthenticated, isLoading: authLoading } = useAuth();

  // Modo Simplificado travado: acesso exclusivo via link, somente este complexo.
  const simplifiedLock = !!selectedVenue && isSimplifiedVenue(selectedVenue) && enteredViaDirectLink && !isManagerView;

  // Ref para uso dentro do listener de popstate (evita closure desatualizada).
  const lockRef = useRef({ locked: false, venue: null });
  lockRef.current = { locked: simplifiedLock, venue: selectedVenue };

  const handleSelectVenue = (venue) => {
    setSelectedVenue(venue);
    // Em /gestao a URL é própria — não sobrescreve ao trocar de complexo por dentro do painel.
    if (Platform.OS === 'web' && typeof window !== 'undefined' && isGestaoRoute(window.location.href)) {
      return;
    }
    syncVenueUrlInBrowser(venue);
  };

  const handleBackFromVenue = () => {
    // No modo Simplificado com link exclusivo, não há volta para a lista de complexos.
    if (simplifiedLock) return;
    setSelectedVenue(null);
    syncVenueUrlInBrowser(null);
  };

  const openManagerView = () => {
    setIsManagerView(true);
    setAuthScreen(null);
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

    // Tenta os candidatos em sequência (subdomínio curto pode não ser o slug real).
    // Ex: ["recanto", "recanto-beach-sports-e-lazer"] — o primeiro que existir vence.
    const loadDefaultVenue = async () => {
      const candidates = getDefaultVenueCandidates();
      for (const candidate of candidates) {
        const venue = await loadVenueByIdentifier(candidate);
        if (venue) return venue;
      }
      return null;
    };

    const handleUrl = async (url, isInitial = false) => {
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
            const candidates = getDefaultVenueCandidates();
            if (candidates.length > 0) {
              setEnteredViaDirectLink(true);
              for (const candidate of candidates) {
                const venue = await loadVenueByIdentifier(candidate);
                if (venue) break;
              }
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
      handleUrl(window.location.href, true);
    } else {
      Linking.getInitialURL().then((url) => {
        if (url) handleUrl(url, true);
      });
    }

    // Listen to deep link events
    const subscription = Linking.addEventListener('url', (event) => {
      if (event.url) handleUrl(event.url, false);
    });

    // Listen to browser back/forward buttons on Web
    let handlePopState;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      handlePopState = () => {
        const currentHref = window.location.href;
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
    // No modo Simplificado travado, o usuário não navega para outras abas/complexos.
    if (simplifiedLock) return;
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
    // MODO SIMPLIFICADO (link exclusivo /complexo/slug):
    // sem tela inicial, sem lista/busca de outros complexos, sem abas de navegação.
    // Apenas quadras + horários do complexo + Agendar via WhatsApp (sem criar reserva).
    if (simplifiedLock) {
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

    if (isManagerView) {
      // Guarda de rota /gestao: logado + GESTOR_ESPACO/ADMIN entra direto,
      // senão cai no login (e após logar o AuthContext re-renderiza para o painel).
      if (authLoading) {
        return (
          <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        );
      }
      if (!isAuthenticated || !isManager) {
        return (
          <LoginScreen
            onNavigateRegister={() => setAuthScreen('register')}
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
      const id = 'google-fonts-sfacco';
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
