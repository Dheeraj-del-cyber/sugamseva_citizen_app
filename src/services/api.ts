import Constants from 'expo-constants';
import { User, FingerprintRecord, Application, CitizenDocument, Scheme } from '../types';

const API_PORT = 5000;

// Resolve the backend URL for every environment this app can run in:
//  - Web (browser): use the page's own hostname.
//  - Expo Go / dev client on a phone or emulator: `localhost` refers to the PHONE
//    itself, not your computer, so we instead read the LAN IP that Expo's dev
//    server is already using to talk to this device (hostUri, e.g. "192.168.1.42:8081")
//    and reuse that same IP for the API. This means no manual IP editing is needed -
//    it just works as long as the backend is running on your computer on the same
//    network and `npm run dev`/`expo start` was used to launch the app.
//  - Fallback: localhost (works for iOS simulator, and as a last resort).
const resolveApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    // Running as a website (web build / Expo web).
    return `http://${window.location.hostname}:${API_PORT}/api`;
  }

  // Android emulator: 10.0.2.2 is the special alias for the host machine's localhost.
  const { Platform } = require('react-native');
  if (Platform.OS === 'android' && !Constants.isDevice) {
    return `http://10.0.2.2:${API_PORT}/api`;
  }

  // Physical device / other emulator via Expo Go or dev client: derive the host
  // machine's LAN IP from the URI Expo used to load this app's JS bundle.
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host) {
      return `http://${host}:${API_PORT}/api`;
    }
  }

  // Last resort - only correct for an iOS simulator running alongside the backend.
  return `http://localhost:${API_PORT}/api`;
};

const API_BASE_URL = resolveApiBaseUrl();

if (typeof __DEV__ !== 'undefined' && __DEV__) {
  // eslint-disable-next-line no-console
  console.log(`[API] Using backend URL: ${API_BASE_URL}`);
}

// In-memory token & user persistence
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (typeof window !== 'undefined' && window.localStorage) {
    if (token) {
      window.localStorage.setItem('sugamseva_jwt_token', token);
    } else {
      window.localStorage.removeItem('sugamseva_jwt_token');
    }
  }
};

export const getAuthToken = (): string | null => {
  if (authToken) return authToken;
  if (typeof window !== 'undefined' && window.localStorage) {
    authToken = window.localStorage.getItem('sugamseva_jwt_token');
  }
  return authToken;
};

// Generic fetch wrapper with auth header
const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP Error ${response.status}`);
    }

    return data as T;
  } catch (error: any) {
    console.warn(`[API] Network request to ${url} failed:`, error.message);
    throw error;
  }
};

export interface SignUpParams {
  name: string;
  phone: string;
  password: string;
  email?: string;
}

export interface SignInParams {
  phone: string;
  password?: string;
  isBiometric?: boolean;
  deviceId?: string;
  deviceSecret?: string;
}

export interface AuthResponseData {
  success: boolean;
  message?: string;
  token: string;
  user: User;
  fingerprints: FingerprintRecord[];
}

export const api = {
  // Check Backend Health
  checkHealth: async () => {
    try {
      return await request<{ status: string; service: string }>('/health');
    } catch {
      return null;
    }
  },

  // Auth: Sign Up with 4-finger biometric enrollment
  signup: async (params: SignUpParams): Promise<AuthResponseData> => {
    return await request<AuthResponseData>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Auth: Sign In via password or biometric
  signin: async (params: SignInParams): Promise<AuthResponseData> => {
    return await request<AuthResponseData>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Auth: Register real biometric sign-in for this device (call only after a genuine
  // OS fingerprint/Face ID check has succeeded)
  registerBiometricDevice: async (deviceId: string, deviceName: string, secret: string) => {
    return await request<{ success: boolean; message: string }>('/auth/biometric/register', {
      method: 'POST',
      body: JSON.stringify({ deviceId, deviceName, secret }),
    });
  },

  // Auth: Remove biometric sign-in for a device
  removeBiometricDevice: async (deviceId: string) => {
    return await request<{ success: boolean; removed: boolean }>(`/auth/biometric/${deviceId}`, {
      method: 'DELETE',
    });
  },

  // Auth: Check (pre-login) whether fingerprint sign-in is already enabled for this
  // phone number on this device
  checkBiometricStatus: async (phone: string, deviceId: string) => {
    return await request<{ success: boolean; enabled: boolean }>(
      `/auth/biometric/status?phone=${encodeURIComponent(phone)}&deviceId=${encodeURIComponent(deviceId)}`
    );
  },

  // Citizen Profile
  getProfile: async (): Promise<{ success: boolean; user: User; fingerprints: FingerprintRecord[]; stats: any }> => {
    return await request('/user/profile');
  },

  // Update Profile
  updateProfile: async (updates: { name?: string; email?: string; avatar?: string }): Promise<{ success: boolean; user: User }> => {
    return await request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Fingerprint Biometric Tracking Records
  getFingerprints: async (): Promise<{ success: boolean; fingerprints: FingerprintRecord[]; totalEnrolled: number }> => {
    return await request('/user/fingerprints');
  },

  // Schemes
  getSchemes: async (): Promise<{ success: boolean; schemes: Scheme[] }> => {
    return await request('/schemes');
  },

  // User Applications
  getApplications: async (): Promise<{ success: boolean; applications: Application[] }> => {
    return await request('/applications');
  },

  // Submit Application
  submitApplication: async (schemeId: string, schemeName: string): Promise<{ success: boolean; application: Application }> => {
    return await request('/applications', {
      method: 'POST',
      body: JSON.stringify({ schemeId, schemeName }),
    });
  },

  // Citizen Documents
  getDocuments: async (): Promise<{ success: boolean; documents: CitizenDocument[] }> => {
    return await request('/documents');
  }
};