import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, Platform } from 'react-native';
import { NavigationProvider, useAppNavigation } from './src/navigation/NavigationContext';
import AppHeader from './src/components/AppHeader';
import BottomNavigation from './src/components/BottomNavigation';
import HomeScreen from './src/screens/HomeScreen';
import DiscoverSchemesScreen from './src/screens/DiscoverSchemesScreen';
import SchemeDetailsScreen from './src/screens/SchemeDetailsScreen';
import ApplicationScreen from './src/screens/ApplicationScreen';
import TrackApplicationScreen from './src/screens/TrackApplicationScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import DigiLockerScreen from './src/screens/DigiLockerScreen';
import VoiceAssistantModal from './src/screens/VoiceAssistantModal';
import { COLORS } from './src/constants/colors';

function MainAppOrchestrator() {
  const { currentScreen } = useAppNavigation();

  // Render active screen based on navigation state
  const renderScreen = () => {
    switch (currentScreen.name) {
      case 'Home':
        return <HomeScreen />;
      case 'Discover':
        return <DiscoverSchemesScreen />;
      case 'Details':
        return <SchemeDetailsScreen />;
      case 'Application':
        return <ApplicationScreen />;
      case 'Track':
        return <TrackApplicationScreen />;
      case 'Profile':
        return <ProfileScreen />;
      case 'DigiLocker':
        return <DigiLockerScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <AppHeader />
      <View style={styles.bodyContainer}>
        {renderScreen()}
      </View>
      <BottomNavigation />
      <VoiceAssistantModal />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <NavigationProvider>
      <MainAppOrchestrator />
    </NavigationProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  bodyContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
