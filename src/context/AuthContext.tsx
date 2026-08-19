import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, FingerprintRecord } from '../types';
import { api, setAuthToken, getAuthToken, SignUpParams } from '../services/api';

interface AuthContextType {
  user: User | null;
  fingerprints: FingerprintRecord[];
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  signUp: (params: SignUpParams) => Promise<boolean>;
  signIn: (phone: string, password: string) => Promise<boolean>;
  signInWithBiometrics: (phone: string, fingerIndex?: number) => Promise<boolean>;
  updateProfile: (updates: { name?: string; email?: string; avatar?: string }) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [fingerprints, setFingerprints] = useState<FingerprintRecord[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize and check existing auth session
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAuthToken();
      if (storedToken) {
        setToken(storedToken);
        try {
          const profileData = await api.getProfile();
          if (profileData && profileData.user) {
            setUser(profileData.user);
            setFingerprints(profileData.fingerprints || []);
          } else {
            logout();
          }
        } catch (e) {
          console.log('[AuthContext] Session validation failed:', e);
          // Don't auto-logout immediately if offline
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const clearError = () => setAuthError(null);

  // Sign Up with 4-finger biometric enrollment
  const signUp = async (params: SignUpParams): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await api.signup(params);
      if (response.success && response.token && response.user) {
        setAuthToken(response.token);
        setToken(response.token);
        setUser(response.user);
        setFingerprints(response.fingerprints || []);
        setIsLoading(false);
        return true;
      } else {
        setAuthError(response.message || 'Registration failed');
        setIsLoading(false);
        return false;
      }
    } catch (error: any) {
      console.error('[AuthContext] Sign up error:', error);
      setAuthError(error.message || 'Registration failed. Please check network.');
      setIsLoading(false);
      return false;
    }
  };

  // Sign In with Phone + Password
  const signIn = async (phone: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await api.signin({ phone, password });
      if (response.success && response.token && response.user) {
        setAuthToken(response.token);
        setToken(response.token);
        setUser(response.user);
        setFingerprints(response.fingerprints || []);
        setIsLoading(false);
        return true;
      } else {
        setAuthError(response.message || 'Sign in failed');
        setIsLoading(false);
        return false;
      }
    } catch (error: any) {
      console.error('[AuthContext] Sign in error:', error);
      setAuthError(error.message || 'Invalid credentials or network error.');
      setIsLoading(false);
      return false;
    }
  };

  // Sign In with Phone + Fingerprint Biometrics
  const signInWithBiometrics = async (phone: string, fingerIndex: number = 0): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await api.signin({ phone, isBiometric: true, fingerIndex });
      if (response.success && response.token && response.user) {
        setAuthToken(response.token);
        setToken(response.token);
        setUser(response.user);
        setFingerprints(response.fingerprints || []);
        setIsLoading(false);
        return true;
      } else {
        setAuthError(response.message || 'Biometric verification failed');
        setIsLoading(false);
        return false;
      }
    } catch (error: any) {
      console.error('[AuthContext] Biometric sign in error:', error);
      setAuthError(error.message || 'Biometric verification failed.');
      setIsLoading(false);
      return false;
    }
  };

  // Update Profile details in database
  const updateProfile = async (updates: { name?: string; email?: string; avatar?: string }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.updateProfile(updates);
      if (res.success && res.user) {
        setUser(prev => prev ? { ...prev, ...res.user } : res.user);
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch (error: any) {
      console.error('[AuthContext] Update profile error:', error);
      setAuthError(error.message);
      setIsLoading(false);
      return false;
    }
  };

  // Refresh profile from server
  const refreshProfile = async () => {
    try {
      const res = await api.getProfile();
      if (res.success && res.user) {
        setUser(res.user);
        setFingerprints(res.fingerprints || []);
      }
    } catch (e) {
      console.warn('[AuthContext] Refresh profile failed:', e);
    }
  };

  // Logout
  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setFingerprints([]);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        fingerprints,
        token,
        isAuthenticated: !!user,
        isLoading,
        authError,
        signUp,
        signIn,
        signInWithBiometrics,
        updateProfile,
        refreshProfile,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
