import { User, FingerprintRecord, Application, CitizenDocument, Scheme } from '../types';

// Default API URL (can be customized for mobile / web)
const API_BASE_URL = typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost'
  ? `http://${window.location.hostname}:5000/api`
  : 'http://localhost:5000/api';

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
  fingerprints: {
    fingerIndex: number;
    fingerName: string;
    biometricTemplate?: string;
    scanQuality?: number;
  }[];
}

export interface SignInParams {
  phone: string;
  password?: string;
  isBiometric?: boolean;
  fingerIndex?: number;
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

  // Auth: Verify specific biometric
  verifyBiometric: async (phone: string, fingerIndex: number) => {
    return await request<{ success: boolean; verified: boolean; fingerName: string; quality: number }>(
      '/auth/biometric-verify',
      {
        method: 'POST',
        body: JSON.stringify({ phone, fingerIndex }),
      }
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
