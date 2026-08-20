export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  cleanPhone?: string;
  avatar: string;
  createdAt?: string;
  updatedAt?: string;
  fingerprintsCount?: number;
}

// Represents a device that has real OS-level fingerprint/Face ID sign-in enabled.
// We never store the fingerprint itself - only metadata about which device was
// approved after the phone's own biometric sensor confirmed a real match.
export interface FingerprintRecord {
  id: string;
  userId?: string;
  deviceId: string;
  deviceName: string;
  enrolledAt: string;
  lastVerifiedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  fingerprints?: FingerprintRecord[];
  error?: string;
}

export type SchemeCategory = 
  | 'Agriculture'
  | 'Education'
  | 'Health'
  | 'Housing'
  | 'Employment'
  | 'Women & Child'
  | 'Pension'
  | 'Disability';

export interface Scheme {
  id: string;
  name: string;
  category: SchemeCategory;
  description: string;
  benefits: string; // e.g. "₹6,000 per year"
  benefitsDetail?: string; // e.g. "in 3 equal installments"
  eligibilityCriteria: string[];
  requiredDocuments: string[];
  state: string; // e.g. "Karnataka" or "Central"
  isEligible: boolean;
}

export interface Application {
  id: string;
  schemeId: string;
  schemeName: string;
  submittedDate: string;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Benefits Disbursed';
  currentStep: number; // 1 to 4
  steps: {
    title: string;
    status: 'Completed' | 'In Progress' | 'Pending';
    date?: string;
  }[];
}

export interface CitizenDocument {
  id: string;
  name: string;
  type: string;
  status: 'Verified' | 'Pending';
  source: 'DigiLocker' | 'Manual';
  docNumber?: string;
}

export type AppLanguage = 'en' | 'kn' | 'hi';