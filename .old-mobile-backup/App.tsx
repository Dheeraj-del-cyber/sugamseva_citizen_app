import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { NavigationProvider, useAppNavigation } from './src/navigation/NavigationContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import AppHeader from './src/components/AppHeader';
import BottomNavigation from './src/components/BottomNavigation';
import HomeScreen from './src/screens/HomeScreen';
import DiscoverSchemesScreen from './src/screens/DiscoverSchemesScreen';
import SchemeDetailsScreen from './src/screens/SchemeDetailsScreen';
import ApplicationScreen from './src/screens/ApplicationScreen';
import TrackApplicationScreen from './src/screens/TrackApplicationScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import DocumentsScreen from './src/screens/DocumentsScreen';
import DocumentCaptureScreen from './src/screens/DocumentCaptureScreen';
import VoiceAssistantModal from './src/screens/VoiceAssistantModal';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { COLORS } from './src/constants/colors';

// ─── Main app router (used when appPhase === 'app') ──────────────────────────
function MainApp() {
  const { currentScreen } = useAppNavigation();

  const renderScreen = () => {
    switch (currentScreen.name) {
      case 'Home':        return <HomeScreen />;
      case 'Discover':    return <DiscoverSchemesScreen />;
      case 'Details':     return <SchemeDetailsScreen />;
      case 'Application': return <ApplicationScreen />;
      case 'Track':       return <TrackApplicationScreen />;
      case 'Profile':     return <ProfileScreen />;
      case 'Documents':   return <DocumentsScreen />;
      case 'DocumentCapture': return <DocumentCaptureScreen />;
      default:            return <HomeScreen />;
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

// ─── Onboarding router ────────────────────────────────────────────────────────
// During onboarding, document capture is accessible via NavigationContext push,
// so we need to handle it here before falling through to OnboardingScreen.
function OnboardingRouter() {
  const { currentScreen } = useAppNavigation();

  if (currentScreen.name === 'DocumentCapture') {
    return <DocumentCaptureScreen />;
  }
  return <OnboardingScreen />;
}

// ─── App orchestrator (reads appPhase from AuthContext) ───────────────────────
function AppOrchestrator() {
  const { appPhase } = useAuth();

  switch (appPhase) {
    case 'loading':
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );

    case 'auth':
      return <AuthScreen />;

    case 'onboarding':
      return <OnboardingRouter />;

    case 'app':
      return <MainApp />;

    default:
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
  }
}

// ─── Root component ───────────────────────────────────────────────────────────
export default function App() {
  return (
    <NavigationProvider>
      <AuthProvider>
        <DataProvider>
          <AppOrchestrator />
        </DataProvider>
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