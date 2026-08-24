import React, { useState, useEffect } from 'react';
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

function MainAppContent() {
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [authScreen, setAuthScreen] = useState(null); // null | 'login' | 'register'
  const [isManagerView, setIsManagerView] = useState(false);
  const [activeTab, setActiveTab] = useState('explorar');
  const { colors } = useTheme();
  const { isManager } = useAuth();

  const handleSelectVenue = (venue) => {
    setSelectedVenue(venue);
    syncVenueUrlInBrowser(venue);
  };

  const handleBackFromVenue = () => {
    setSelectedVenue(null);
    syncVenueUrlInBrowser(null);
  };

  useEffect(() => {
    let isMounted = true;

    const handleUrl = async (url) => {
      const venueId = getVenueIdFromUrl(url);
      if (venueId) {
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
      }
    };

    // Check initial URL on launch
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      handleUrl(window.location.href);
    } else {
      Linking.getInitialURL().then((url) => {
        if (url) handleUrl(url);
      });
    }

    // Listen to deep link events
    const subscription = Linking.addEventListener('url', (event) => {
      if (event.url) handleUrl(event.url);
    });

    // Listen to browser back/forward buttons on Web
    let handlePopState;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      handlePopState = () => {
        const vId = getVenueIdFromUrl(window.location.href);
        if (vId) {
          handleUrl(window.location.href);
        } else {
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
    if (tabId === 'gestao') {
      setIsManagerView(true);
    } else {
      setIsManagerView(false);
      setActiveTab(tabId);
    }
  };

  const renderCurrentScreen = () => {
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
