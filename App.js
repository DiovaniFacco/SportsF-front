import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { useFonts, GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { JosefinSans_700Bold } from '@expo-google-fonts/josefin-sans';
import { ComplexesScreen } from './src/screens/ComplexesScreen';
import { VenueCourtsScreen } from './src/screens/VenueCourtsScreen';
import { theme } from './src/styles/theme';

export default function App() {
  const [selectedVenue, setSelectedVenue] = useState(null);

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
    <View style={styles.container}>
      {selectedVenue ? (
        <VenueCourtsScreen
          venueId={selectedVenue.id}
          onBack={() => setSelectedVenue(null)}
        />
      ) : (
        <ComplexesScreen onSelectVenue={(venue) => setSelectedVenue(venue)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
