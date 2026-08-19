import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { useFonts, GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { JosefinSans_700Bold } from '@expo-google-fonts/josefin-sans';
import { ComplexesScreen } from './src/screens/ComplexesScreen';
import { VenueCourtsScreen } from './src/screens/VenueCourtsScreen';
import { CourtSlotsScreen } from './src/screens/CourtSlotsScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';

function MainAppContent() {
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [authScreen, setAuthScreen] = useState(null); // null | 'login' | 'register'
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {authScreen === 'login' ? (
        <LoginScreen
          onNavigateRegister={() => setAuthScreen('register')}
          onBack={() => setAuthScreen(null)}
          onLoginSuccess={() => setAuthScreen(null)}
        />
      ) : authScreen === 'register' ? (
        <RegisterScreen
          onNavigateLogin={() => setAuthScreen('login')}
          onBack={() => setAuthScreen(null)}
          onRegisterSuccess={() => setAuthScreen(null)}
        />
      ) : selectedCourt ? (
        <CourtSlotsScreen
          court={selectedCourt}
          venue={selectedVenue}
          onBack={() => setSelectedCourt(null)}
          onOpenAuth={() => setAuthScreen('login')}
        />
      ) : selectedVenue ? (
        <VenueCourtsScreen
          venueId={selectedVenue.id}
          onBack={() => setSelectedVenue(null)}
          onSelectCourt={(court, venueObj) => {
            if (venueObj) setSelectedVenue(venueObj);
            setSelectedCourt(court);
          }}
        />
      ) : (
        <ComplexesScreen
          onSelectVenue={(venue) => setSelectedVenue(venue)}
          onOpenAuth={() => setAuthScreen('login')}
        />
      )}
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
