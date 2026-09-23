import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
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
import { getVenueIdFromUrl, syncVenueUrlInBrowser } from './src/utils/linking';
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
  const { isManager } = useAuth();

  // Modo Simplificado travado: acesso exclusivo via link, somente este complexo.
  const simplifiedLock = !!selectedVenue && isSimplifiedVenue(selectedVenue) && enteredViaDirectLink && !isManagerView;

  // Ref para uso dentro do listener de popstate (evita closure desatualizada).
  const lockRef = useRef({ locked: false, venue: null });
  lockRef.current = { locked: simplifiedLock, venue: selectedVenue };

  const handleSelectVenue = (venue) => {
    setSelectedVenue(venue);
    syncVenueUrlInBrowser(venue);
  };

  const handleBackFromVenue = () => {
    // No modo Simplificado com link exclusivo, não há volta para a lista de complexos.
    if (simplifiedLock) return;
    setSelectedVenue(null);
    syncVenueUrlInBrowser(null);
  };

  useEffect(() => {
    let isMounted = true;

    const handleUrl = async (url, isInitial = false) => {
      const venueId = getVenueIdFromUrl(url);
      if (venueId) {
        if (isInitial && isMounted) {
          setEnteredViaDirectLink(true);
        }
        try {
          const venue = await getVenueDetails(venueId);
          if (isMounted && venue) {
            setSelectedVenue(venue);
            setSelectedCourt(null);
            setIsManagerView(false);
            setAuthScreen(null);
            setActiveTab('explorar');
            syncVenueUrlInBrowser(venue);
          }
        } catch (err) {
          console.error('Erro ao carregar complexo do link:', err);
        }
      } else if (isInitial) {
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
        const vId = getVenueIdFromUrl(window.location.href);
        if (vId) {
          handleUrl(window.location.href, false);
        } else {
          // No modo Simplificado travado, impede sair do complexo via voltar do navegador.
          if (lockRef.current.locked && lockRef.current.venue) {
            syncVenueUrlInBrowser(lockRef.current.venue);
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
      setIsManagerView(true);
    } else {
      setIsManagerView(false);
      setActiveTab(tabId);
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
      return (
        <ManagerHomeScreen
          onBackToUserView={() => setIsManagerView(false)}
        />
      );
    }

    if (activeTab === 'perfil') {
      return (
        <ProfileScreen
          onTabChange={handleTabChange}
          onGoToExplore={() => setActiveTab('explorar')}
          onOpenAuth={() => setAuthScreen('login')}
          onOpenManager={() => setIsManagerView(true)}
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
        onOpenManager={() => setIsManagerView(true)}
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
