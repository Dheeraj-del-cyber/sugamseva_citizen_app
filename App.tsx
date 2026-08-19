import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { NavigationProvider, useAppNavigation } from './src/navigation/NavigationContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
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
import AuthScreen from './src/screens/AuthScreen';
import { COLORS } from './src/constants/colors';

function MainAppOrchestrator() {
  const { currentScreen } = useAppNavigation();
  const { isAuthenticated, isLoading } = useAuth();

  // Show Loading Spinner during initial auth check
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // If citizen is not signed in, show Sign In / Sign Up with 4-Finger Biometrics
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

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
      <AuthProvider>
        <MainAppOrchestrator />
      </AuthProvider>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
