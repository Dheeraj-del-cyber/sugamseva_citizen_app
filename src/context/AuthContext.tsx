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

interface AuthContextType {
  user: User | null;
  fingerprints: FingerprintRecord[];
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  biometricAvailableOnThisDevice: boolean;
  biometricEnabledOnThisDevice: boolean;
  signUp: (params: SignUpParams) => Promise<boolean>;
  signIn: (phone: string, password: string) => Promise<boolean>;
  /** Enrolls THIS device for real fingerprint/Face ID sign-in. Requires the user to
   * already be signed in, and requires the phone's own OS biometric prompt to succeed. */
  enableBiometricSignIn: () => Promise<{ success: boolean; error?: string }>;
  disableBiometricSignIn: () => Promise<void>;
  /** Signs in using a real OS fingerprint/Face ID check on this device. */
  signInWithBiometrics: (phone: string) => Promise<boolean>;
  checkDeviceHasBiometricEnabled: (phone: string) => Promise<boolean>;
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
  const [biometricAvailableOnThisDevice, setBiometricAvailableOnThisDevice] = useState(false);
  const [biometricEnabledOnThisDevice, setBiometricEnabledOnThisDevice] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');

  // Discover real hardware capability + local enrollment state on mount
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

  // Enable REAL fingerprint / Face ID sign-in on this device. Must be called while
  // already signed in. Runs the actual OS biometric prompt - nothing is registered
  // unless the phone's own sensor confirms a live match against the person's enrolled
  // print/face.
  const enableBiometricSignIn = async (): Promise<{ success: boolean; error?: string }> => {
    const hw = await checkBiometricHardware();
    if (!hw.available) {
      return { success: false, error: hw.reason };
    }

    const osResult = await runOsBiometricPrompt('Confirm your fingerprint to enable fingerprint sign-in');
    if (!osResult.success) {
      return { success: false, error: osResult.error };
    }

    try {
      const secret = await generateAndStoreBiometricSecret(deviceId);
      await api.registerBiometricDevice(deviceId, getDeviceName(), secret);
      setBiometricEnabledOnThisDevice(true);
      await refreshProfile();
      return { success: true };
    } catch (error: any) {
      await clearBiometricSecret(deviceId);
      return { success: false, error: error.message || 'Could not enable fingerprint sign-in. Please try again.' };
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

  // Sign In with Phone + a REAL device fingerprint/Face ID check
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
      setAuthError('Fingerprint sign-in is not set up for this account on this device. Please sign in with your password and enable it from your profile.');
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
        biometricAvailableOnThisDevice,
        biometricEnabledOnThisDevice,
        signUp,
        signIn,
        enableBiometricSignIn,
        disableBiometricSignIn,
        signInWithBiometrics,
        checkDeviceHasBiometricEnabled,
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