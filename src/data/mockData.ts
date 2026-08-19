import { User, Scheme, CitizenDocument, Application } from '../types';

export const mockUser: User = {
  id: 'usr_1',
  name: 'Dheeraj',
  email: 'dheeraj@example.com',
  phone: '+91 98765 43210',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
};

export const mockDocuments: CitizenDocument[] = [
  {
    id: 'doc_1',
    name: 'Aadhaar Card',
    type: 'Identity',
    status: 'Verified',
    source: 'DigiLocker',
    docNumber: 'XXXX XXXX 8943',
  },
  {
    id: 'doc_2',
    name: 'Bank Account',
    type: 'Financial',
    status: 'Verified',
    source: 'DigiLocker',
    docNumber: 'SBI - *******4920',
  },
  {
    id: 'doc_3',
    name: 'Land Records',
    type: 'Property',
    status: 'Verified',
    source: 'DigiLocker',
    docNumber: 'RTC-KA-2024-991',
  },
  {
    id: 'doc_4',
    name: 'Ration Card',
    type: 'Income',
    status: 'Pending',
    source: 'Manual',
    docNumber: 'RC-KA-9204-102',
  }
];

export const mockSchemes: Scheme[] = [
  {
    id: 'pm-kisan',
    name: 'PM-KISAN Samman Nidhi',
    category: 'Agriculture',
    description: 'Financial support to landholding farmer families.',
    benefits: '₹6,000 per year',
    benefitsDetail: 'in 3 equal installments',
    eligibilityCriteria: [
      'You are a farmer',
      'Landholding is in your name',
      'Registered in Karnataka',
    ],
    requiredDocuments: [
      'Aadhaar Card',
      'Bank Account',
      'Land Records',
    ],
    state: 'Karnataka',
    isEligible: true,
  },
  {
    id: 'pms-edu',
    name: 'Post-Matric Scholarship Scheme',
    category: 'Education',
    description: 'Financial assistance for post-matriculation or post-secondary courses.',
    benefits: 'Full Tuition Fee Waiver',
    benefitsDetail: 'Direct benefit transfer to bank',
    eligibilityCriteria: [
      'Annual family income < ₹2.5 Lakhs',
      'Belongs to SC/ST/OBC category',
      'Pursuing post-matric courses in recognized institutions',
    ],
    requiredDocuments: [
      'Aadhaar Card',
      'Caste Certificate',
      'Income Certificate',
    ],
    state: 'Karnataka',
    isEligible: true,
  },
  {
    id: 'pm-jay',
    name: 'Ayushman Bharat PM-JAY',
    category: 'Health',
    description: 'Health cover of ₹5 Lakhs per family per year for secondary and tertiary care hospitalization.',
    benefits: '₹5,00,000 / year',
    benefitsDetail: 'Cashless treatment in empaneled hospitals',
    eligibilityCriteria: [
      'Identified in SECC 2011 database',
      'Families living in one room with kucha walls',
      'No adult member between age 16-59',
    ],
    requiredDocuments: [
      'Aadhaar Card',
      'Ration Card',
    ],
    state: 'Central',
    isEligible: false,
  },
  {
    id: 'pmay-house',
    name: 'Pradhan Mantri Awas Yojana',
    category: 'Housing',
    description: 'Housing for All scheme offering subsidy on home loan interest rates.',
    benefits: 'Up to ₹2.67 Lakhs Subsidy',
    benefitsDetail: 'Interest subsidy on home loans',
    eligibilityCriteria: [
      'Family must not own a pucca house in India',
      'Annual household income within limits (EWS/LIG)',
    ],
    requiredDocuments: [
      'Aadhaar Card',
      'Income Proof',
      'Property details',
    ],
    state: 'Central',
    isEligible: true,
  },
  {
    id: 'nps-pension',
    name: 'National Pension Scheme',
    category: 'Pension',
    description: 'Voluntary defined contribution pension system for citizens.',
    benefits: 'Market-linked returns',
    benefitsDetail: 'Tax benefits under Sec 80C',
    eligibilityCriteria: [
      'Citizen of India aged between 18-70 years',
      'Must comply with KYC norms',
    ],
    requiredDocuments: [
      'Aadhaar Card',
      'PAN Card',
      'Bank Details',
    ],
    state: 'Central',
    isEligible: true,
  },
  {
    id: 'dis-allowance',
    name: 'Disability Pension & Allowance',
    category: 'Disability',
    description: 'Monthly pension and allowance for persons with disabilities.',
    benefits: '₹2,000 / month',
    benefitsDetail: 'Direct transfer for life',
    eligibilityCriteria: [
      'Disability percentage is 40% or above',
      'Living in Karnataka',
      'Family income < ₹1.5 Lakhs per year',
    ],
    requiredDocuments: [
      'Aadhaar Card',
      'Disability Certificate',
      'Income Certificate',
    ],
    state: 'Karnataka',
    isEligible: true,
  }
];

export const mockApplications: Application[] = [
  {
    id: 'PMKISAN2024XXXX',
    schemeId: 'pm-kisan',
    schemeName: 'PM-KISAN Samman Nidhi',
    submittedDate: '12 May 2025',
    status: 'Under Review',
    currentStep: 4,
    steps: [
      { title: 'Application Submitted', status: 'Completed', date: '12 May 2025' },
      { title: 'Documents Verified', status: 'Completed', date: '14 May 2025' },
      { title: 'Under Review', status: 'In Progress', date: 'Since 16 May 2025' },
      { title: 'Approved', status: 'Pending' },
      { title: 'Benefits Disbursed', status: 'Pending' },
    ],
  }
];
