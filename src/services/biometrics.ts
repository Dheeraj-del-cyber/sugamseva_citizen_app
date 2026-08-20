import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

/**
 * REAL device biometrics.
 *
 * Important, honest constraint: no third-party app on iOS or Android is ever given
 * access to a user's actual fingerprint image or template - that data never leaves the
 * phone's secure hardware (Secure Enclave / TEE + Android Keystore), by design, for
 * everyone's security. This is true for every app, not just this one.
 *
 * What a real app CAN legitimately do - and what this file does - is:
 *  1. Ask the operating system to run its own fingerprint/Face ID prompt
 *     (LocalAuthentication.authenticateAsync). The OS checks the live scan against
 *     whatever the person already enrolled in their phone's Settings.
 *  2. Only if that OS check succeeds, generate a random secret and seal it inside the
 *     phone's secure hardware storage (SecureStore / Keychain / Android Keystore).
 *  3. Register that secret with our server once (over an authenticated connection).
 *  4. On future sign-ins, ask the OS to re-verify the person's live fingerprint/face
 *     again before releasing the secret from secure storage, then send it to the server
 *     to prove "this specific, previously-approved device, unlocked by a real biometric
 *     check just now, is asking to sign in."
 *
 * This is the same pattern real banking apps and UPI apps use for "fingerprint login."
 */

const DEVICE_ID_KEY = 'sugamseva_device_id';
const BIOMETRIC_SECRET_PREFIX = 'sugamseva_biometric_secret_';

const secureStoreAvailable = Platform.OS !== 'web';

async function secureGet(key: string): Promise<string | null> {
  if (!secureStoreAvailable) {
    // Web has no OS keystore; fall back to localStorage purely for the web preview.
    // This is clearly weaker than hardware-backed storage, which is exactly why real
    // fingerprint sign-in should be used on an actual Android/iOS device.
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  }
  return SecureStore.getItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (!secureStoreAvailable) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    return;
  }
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function secureDelete(key: string): Promise<void> {
  if (!secureStoreAvailable) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

// A stable per-install identifier so the server can tell devices apart. Persisted in
// secure storage so it survives app restarts but is unique to this install.
export const getDeviceId = async (): Promise<string> => {
  let id = await secureGet(DEVICE_ID_KEY);
  if (!id) {
    id = Crypto.randomUUID();
    await secureSet(DEVICE_ID_KEY, id);
  }
  return id;
};

export const getDeviceName = (): string => {
  return `${Platform.OS === 'ios' ? 'iPhone' : Platform.OS === 'android' ? 'Android device' : 'Web browser'}`;
};

export interface HardwareCheckResult {
  available: boolean;
  reason?: string;
}

// Checks whether this phone actually has a fingerprint/Face ID sensor with at least
// one print/face already enrolled in the OS. If not, there is nothing real to hook into.
export const checkBiometricHardware = async (): Promise<HardwareCheckResult> => {
  if (Platform.OS === 'web') {
    return { available: false, reason: 'Fingerprint sign-in needs a phone with a fingerprint sensor or Face ID - open this app on your Android or iOS device.' };
  }
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) {
    return { available: false, reason: 'This device has no fingerprint or face recognition sensor.' };
  }
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!isEnrolled) {
    return { available: false, reason: 'No fingerprint or face is enrolled on this device yet. Add one in your phone Settings first.' };
  }
  return { available: true };
};

// Runs the REAL OS biometric prompt. Returns true only if the phone's own sensor
// confirmed a live match against what's enrolled in Settings.
export const runOsBiometricPrompt = async (promptMessage: string): Promise<{ success: boolean; error?: string }> => {
  if (Platform.OS === 'web') {
    return { success: false, error: 'Fingerprint sign-in is only available on the Android or iOS app.' };
  }
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    disableDeviceFallback: false,
    cancelLabel: 'Cancel',
  });
  if (result.success) {
    return { success: true };
  }
  return { success: false, error: (result as any).error === 'user_cancel' ? 'Cancelled' : 'Fingerprint / Face ID did not match.' };
};

const secretKeyFor = (deviceId: string) => `${BIOMETRIC_SECRET_PREFIX}${deviceId}`;

export const hasLocalBiometricSecret = async (deviceId: string): Promise<boolean> => {
  const val = await secureGet(secretKeyFor(deviceId));
  return !!val;
};

export const generateAndStoreBiometricSecret = async (deviceId: string): Promise<string> => {
  const secret = Crypto.randomUUID() + Crypto.randomUUID();
  await secureSet(secretKeyFor(deviceId), secret);
  return secret;
};

export const getStoredBiometricSecret = async (deviceId: string): Promise<string | null> => {
  return secureGet(secretKeyFor(deviceId));
};

export const clearBiometricSecret = async (deviceId: string): Promise<void> => {
  await secureDelete(secretKeyFor(deviceId));
};