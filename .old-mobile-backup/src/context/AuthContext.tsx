import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, FingerprintRecord } from '../types';
import { api, setAuthToken, getAuthToken, SignUpParams } from '../services/api';
import {
  getDeviceId,
  getDeviceName,
  checkBiometricHardware,
  runOsBiometricPrompt,
  generateAndStoreBiometricSecret,
  getStoredBiometricSecret,
  hasLocalBiometricSecret,
  clearBiometricSecret,
} from '../services/biometrics';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ─── App Phase ───────────────────────────────────────────────────────────────
// Single source of truth that drives which "gate" App.tsx renders.
//
//  loading          → checking stored JWT on startup
//  auth             → no valid session; show AuthScreen
//  app              → authenticated + onboarded; show main app
// ─────────────────────────────────────────────────────────────────────────────
export type AppPhase = 'loading' | 'auth' | 'onboarding' | 'app';

// Secure-store key helpers ─ stored per user so "done" is per-account
const onboardingKey = (userId: string) => `sugamseva_onboarding_${userId.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

const getOnboardingDone = async (userId: string): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      return !!window.localStorage?.getItem(onboardingKey(userId));
    }
    const val = await SecureStore.getItemAsync(onboardingKey(userId));
    return val === 'true';
  } catch {
    return false;
  }
};

const setOnboardingDone = async (userId: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      window.localStorage?.setItem(onboardingKey(userId), 'true');
      return;
    }
    await SecureStore.setItemAsync(onboardingKey(userId), 'true');
  } catch {
    // non-fatal
  }
};

// ─── Context Interface ────────────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  fingerprints: FingerprintRecord[];
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  appPhase: AppPhase;
  biometricAvailableOnThisDevice: boolean;
  biometricEnabledOnThisDevice: boolean;

  signUp: (params: SignUpParams) => Promise<boolean>;
  signIn: (phone: string, password: string) => Promise<boolean>;
  signInWithBiometrics: (phone: string) => Promise<boolean>;
  enableBiometricSignIn: () => Promise<{ success: boolean; error?: string }>;
  disableBiometricSignIn: () => Promise<void>;
  checkDeviceHasBiometricEnabled: (phone: string) => Promise<boolean>;
  updateProfile: (updates: { name?: string; email?: string; avatar?: string }) => Promise<boolean>;
  refreshProfile: () => Promise<void>;

  /** Called by OnboardingScreen when the user completes all onboarding steps. */
  markOnboardingDone: () => Promise<void>;

  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [fingerprints, setFingerprints] = useState<FingerprintRecord[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [appPhase, setAppPhase] = useState<AppPhase>('loading');
  const [biometricAvailableOnThisDevice, setBiometricAvailableOnThisDevice] = useState(false);
  const [biometricEnabledOnThisDevice, setBiometricEnabledOnThisDevice] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');

  // ── Biometric hardware check on mount ──────────────────────────────────────
  useEffect(() => {
    const initBiometricState = async () => {
      const id = await getDeviceId();
      setDeviceId(id);
      const hw = await checkBiometricHardware();
      setBiometricAvailableOnThisDevice(hw.available);
      const hasSecret = await hasLocalBiometricSecret(id);
      setBiometricEnabledOnThisDevice(hasSecret);
    };
    initBiometricState();
  }, []);

  // ── Restore existing session on mount ──────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAuthToken();
      if (storedToken) {
        setToken(storedToken);
        try {
          const profileData = await api.getProfile();
          if (profileData?.user) {
            setUser(profileData.user);
            setFingerprints(profileData.fingerprints || []);
            // Returning user with valid session — check onboarding
            const done = await getOnboardingDone(profileData.user.id);
            setAppPhase(done ? 'app' : 'onboarding');
          } else {
            // Token stale / user deleted
            setAuthToken(null);
            setAppPhase('auth');
          }
        } catch {
          // Offline — trust the token, go straight to app to avoid locking the user out
          setAppPhase('app');
        }
      } else {
        setAppPhase('auth');
      }
    };
    initAuth();
  }, []);

  const clearError = () => setAuthError(null);

  // ── Sign Up ────────────────────────────────────────────────────────────────
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
        const done = await getOnboardingDone(response.user.id);
        setAppPhase(done ? 'app' : 'onboarding');
        return true;
      }
      setAuthError(response.message || 'Registration failed');
      setIsLoading(false);
      return false;
    } catch (error: any) {
      console.error('[AuthContext] Sign up error:', error);
      setAuthError(error.message || 'Registration failed. Please check your connection.');
      setIsLoading(false);
      return false;
    }
  };

  // ── Sign In ────────────────────────────────────────────────────────────────
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
        const done = await getOnboardingDone(response.user.id);
        setAppPhase(done ? 'app' : 'onboarding');
        return true;
      }
      setAuthError(response.message || 'Sign in failed');
      setIsLoading(false);
      return false;
    } catch (error: any) {
      console.error('[AuthContext] Sign in error:', error);
      setAuthError(error.message || 'Invalid credentials or network error.');
      setIsLoading(false);
      return false;
    }
  };

  // ── Sign In with Biometrics ────────────────────────────────────────────────
  const signInWithBiometrics = async (phone: string): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);

    const hw = await checkBiometricHardware();
    if (!hw.available) {
      setAuthError(hw.reason || 'Fingerprint sign-in is not available on this device.');
      setIsLoading(false);
      return false;
    }

    const osResult = await runOsBiometricPrompt('Sign in to Sugam Seva');
    if (!osResult.success) {
      setAuthError(osResult.error || 'Fingerprint / Face ID did not match.');
      setIsLoading(false);
      return false;
    }

    const deviceSecret = await getStoredBiometricSecret(deviceId);
    if (!deviceSecret) {
      setAuthError('Fingerprint sign-in is not set up on this device. Please sign in with your password.');
      setIsLoading(false);
      return false;
    }

    try {
      const response = await api.signin({ phone, isBiometric: true, deviceId, deviceSecret });
      if (response.success && response.token && response.user) {
        setAuthToken(response.token);
        setToken(response.token);
        setUser(response.user);
        setFingerprints(response.fingerprints || []);
        setIsLoading(false);
        const done = await getOnboardingDone(response.user.id);
        setAppPhase(done ? 'app' : 'onboarding');
        return true;
      }
      setAuthError(response.message || 'Biometric verification failed');
      setIsLoading(false);
      return false;
    } catch (error: any) {
      console.error('[AuthContext] Biometric sign in error:', error);
      setAuthError(error.message || 'Biometric verification failed.');
      setIsLoading(false);
      return false;
    }
  };

  // ── Enable Biometric Sign-In (post login) ──────────────────────────────────
  const enableBiometricSignIn = async (): Promise<{ success: boolean; error?: string }> => {
    const hw = await checkBiometricHardware();
    if (!hw.available) return { success: false, error: hw.reason };

    const osResult = await runOsBiometricPrompt('Confirm your fingerprint to enable fingerprint sign-in');
    if (!osResult.success) return { success: false, error: osResult.error };

    try {
      const secret = await generateAndStoreBiometricSecret(deviceId);
      await api.registerBiometricDevice(deviceId, getDeviceName(), secret);
      setBiometricEnabledOnThisDevice(true);
      await refreshProfile();
      return { success: true };
    } catch (error: any) {
      await clearBiometricSecret(deviceId);
      return { success: false, error: error.message || 'Could not enable fingerprint sign-in. Try again.' };
    }
  };

  const disableBiometricSignIn = async (): Promise<void> => {
    try {
      await api.removeBiometricDevice(deviceId);
    } catch (e) {
      console.warn('[AuthContext] Failed to remove biometric device on server:', e);
    }
    await clearBiometricSecret(deviceId);
    setBiometricEnabledOnThisDevice(false);
  };

  const checkDeviceHasBiometricEnabled = async (phone: string): Promise<boolean> => {
    try {
      const hasSecret = await hasLocalBiometricSecret(deviceId);
      if (!hasSecret) return false;
      const res = await api.checkBiometricStatus(phone, deviceId);
      return !!res.enabled;
    } catch {
      return false;
    }
  };

  // ── Phase advances ─────────────────────────────────────────────────────────

  /**
   * Called by OnboardingScreen when the user finishes all onboarding steps.
   * Persists the flag so it never shows again for this account.
   */
  const markOnboardingDone = async (): Promise<void> => {
    if (user) await setOnboardingDone(user.id);
    setAppPhase('app');
  };

  // ── Profile management ─────────────────────────────────────────────────────
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

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setFingerprints([]);
    setAuthError(null);
    setAppPhase('auth');
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
        appPhase,
        biometricAvailableOnThisDevice,
        biometricEnabledOnThisDevice,
        signUp,
        signIn,
        signInWithBiometrics,
        enableBiometricSignIn,
        disableBiometricSignIn,
        checkDeviceHasBiometricEnabled,
        updateProfile,
        refreshProfile,
        markOnboardingDone,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};