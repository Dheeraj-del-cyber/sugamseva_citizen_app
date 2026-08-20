// React import removed due to verbatimModuleSyntax
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import DashboardLayout from './screens/DashboardLayout';
import HomeScreen from './screens/HomeScreen';

// ─── Protected Route Wrapper ──────────────────────────────────────────────────
function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner" style={{ borderTopColor: 'var(--primary-600)' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // If they are logged in but haven't onboarded, force them to onboarding
  // UNLESS they are already on the onboarding route (handled in AppRoutes)
  if (user && !user.hasOnboarded && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

// ─── Main Router ─────────────────────────────────────────────────────────────
function AppRoutes() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner" style={{ borderTopColor: 'var(--primary-600)' }} />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={isAuthenticated ? <Navigate to="/" replace /> : <AuthScreen />} />
      
      <Route element={<ProtectedRoute />}>
        {/* Onboarding */}
        <Route path="/onboarding" element={
          user?.hasOnboarded ? <Navigate to="/" replace /> : <OnboardingScreen />
        } />
        
        {/* Main App */}
        <Route path="/" element={
          <DashboardLayout>
            <HomeScreen />
          </DashboardLayout>
        } />
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
