require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, initDb } = require('./db');
const { translateBatch, SUPPORTED_LANGUAGES } = require('./translate');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'sugamseva_secure_citizen_jwt_key_2026';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Initialize Database on startup
initDb();

// Seed initial schemes catalog
const SCHEMES_DATA = [
  {
    id: 'pm-kisan',
    name: 'PM-KISAN Samman Nidhi',
    category: 'Agriculture',
    description: 'Financial support to landholding farmer families across India.',
    benefits: '₹6,000 per year',
    benefitsDetail: 'in 3 equal installments of ₹2,000 directly to bank account',
    eligibilityCriteria: [
      'Small and marginal landholding farmer family',
      'Valid cultivable landholding in applicant name',
      'Aadhaar seeded bank account'
    ],
    requiredDocuments: [
      'Aadhaar Card',
      'Bank Account (Jan Dhan / Savings)',
      'Land Records (RTC/Pahani)'
    ],
    state: 'Central',
    isEligible: true
  },
  {
    id: 'pms-edu',
    name: 'Post-Matric Scholarship Scheme',
    category: 'Education',
    description: 'Financial assistance for post-matriculation or post-secondary courses.',
    benefits: 'Full Tuition Fee Waiver + Maintenance Allowance',
    benefitsDetail: 'Direct benefit transfer to student bank account',
    eligibilityCriteria: [
      'Annual family income < ₹2.5 Lakhs',
      'Belongs to SC/ST/OBC category',
      'Pursuing post-matric courses in recognized institutions'
    ],
    requiredDocuments: [
      'Aadhaar Card',
      'Caste Certificate',
      'Income Certificate'
    ],
    state: 'Karnataka',
    isEligible: true
  },
  {
    id: 'pm-jay',
    name: 'Ayushman Bharat PM-JAY',
    category: 'Health',
    description: 'Health cover of ₹5 Lakhs per family per year for secondary and tertiary care hospitalization.',
    benefits: '₹5,00,000 / year',
    benefitsDetail: 'Cashless treatment in empaneled public and private hospitals',
    eligibilityCriteria: [
      'Identified in SECC 2011 database or eligible ration card holder',
      'Rural households with kutcha house or no earning adult member'
    ],
    requiredDocuments: [
      'Aadhaar Card',
      'Ration Card'
    ],
    state: 'Central',
    isEligible: false
  },
  {
    id: 'pmay-house',
    name: 'Pradhan Mantri Awas Yojana (PMAY-Gramin)',
    category: 'Housing',
    description: 'Housing for All scheme offering subsidy on pucca house construction.',
    benefits: 'Up to ₹2.67 Lakhs Subsidy',
    benefitsDetail: 'Direct financial assistance for house construction',
    eligibilityCriteria: [
      'Family must not own a pucca house in India',
      'Annual household income within EWS/LIG limits'
    ],
    requiredDocuments: [
      'Aadhaar Card',
      'Income Certificate',
      'Land Possession Certificate'
    ],
    state: 'Central',
    isEligible: true
  },
  {
    id: 'nps-pension',
    name: 'National Pension Scheme (NPS)',
    category: 'Pension',
    description: 'Voluntary defined contribution pension system for citizen old age security.',
    benefits: 'Market-linked returns + Monthly Pension',
    benefitsDetail: 'Lump sum maturity and monthly annuity pension',
    eligibilityCriteria: [
      'Citizen of India aged between 18-70 years',
      'Valid KYC documents'
    ],
    requiredDocuments: [
      'Aadhaar Card',
      'PAN Card',
      'Bank Account Details'
    ],
    state: 'Central',
    isEligible: true
  },
  {
    id: 'dis-allowance',
    name: 'Disability Pension & Maintenance Allowance',
    category: 'Disability',
    description: 'Monthly pension and allowance for persons with benchmark disabilities.',
    benefits: '₹2,000 / month',
    benefitsDetail: 'Direct monthly transfer for life',
    eligibilityCriteria: [
      'Disability percentage is 40% or above',
      'Resident of Karnataka',
      'Family income < ₹1.5 Lakhs per year'
    ],
    requiredDocuments: [
      'Aadhaar Card',
      'UDID / Disability Certificate',
      'Income Certificate'
    ],
    state: 'Karnataka',
    isEligible: true
  }
];

// Helper: Normalize phone number (extract 10 digits)
const normalizePhone = (phone) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
};

// Auth Token Verification Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token missing or invalid' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired or invalid token' });
    }
    req.user = decoded;
    next();
  });
};

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Sugam Seva Citizen Backend Database & API',
    version: '1.0.0',
    stats: {
      registeredUsers: db.users.all().length
    }
  });
});

// ==========================================
// TRANSLATION ROUTES
// ==========================================

/**
 * GET /api/languages
 * Returns the list of languages the app can be translated into.
 */
app.get('/api/languages', (req, res) => {
  res.json({
    success: true,
    languages: SUPPORTED_LANGUAGES
  });
});

/**
 * POST /api/translate
 * Body: { texts: string[], targetLang: string }
 * Translates a batch of English source strings into targetLang.
 * Results are cached on disk (server/data/translations_cache.json) so
 * repeat requests for the same text/language pair never re-hit the
 * translation API.
 */
app.post('/api/translate', async (req, res) => {
  try {
    const { texts, targetLang } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: '"texts" must be a non-empty array of strings' });
    }
    if (!targetLang || typeof targetLang !== 'string') {
      return res.status(400).json({ error: '"targetLang" is required' });
    }

    const translations = await translateBatch(texts, targetLang);
    res.json({ success: true, targetLang, translations });
  } catch (error) {
    console.error('[Translate] Error:', error.message);
    res.status(500).json({ error: error.message || 'Translation failed' });
  }
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

/**
 * POST /api/auth/signup
 * Register a new citizen account with 4-finger biometric enrollment
 */
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, phone, password, email } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if phone already registered
    const existingUser = db.users.findByPhone(cleanPhone);
    if (existingUser) {
      return res.status(409).json({ error: 'This mobile number is already registered. Please sign in.' });
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 10);
    const userEmail = email && email.trim() ? email.trim() : `${cleanPhone}@sugamseva.gov.in`;
    const avatar = `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(name.trim())}&backgroundColor=047857`;

    // 1. Create User
    const newUser = db.users.create({
      id: userId,
      name: name.trim(),
      phone: cleanPhone,
      email: userEmail,
      password_hash: passwordHash,
      avatar,
      created_at: now,
      updated_at: now
    });

    // Note: fingerprint / biometric sign-in is enrolled separately, after the account
    // exists, via POST /api/auth/biometric/register - and only once the device's OS has
    // confirmed a real fingerprint/Face ID match. See that route for details.

    // 2. Seed Initial DigiLocker Documents for this new citizen
    const initialDocs = [
      { id: `doc_${userId}_1`, user_id: userId, name: 'Aadhaar Card', type: 'Identity', status: 'Verified', source: 'DigiLocker', doc_number: `XXXX XXXX ${cleanPhone.slice(-4)}` },
      { id: `doc_${userId}_2`, user_id: userId, name: 'Bank Account (Jan Dhan)', type: 'Financial', status: 'Verified', source: 'DigiLocker', doc_number: `SBI - *******${cleanPhone.slice(-4)}` },
      { id: `doc_${userId}_3`, user_id: userId, name: 'Ration Card (NFSA)', type: 'Income', status: 'Verified', source: 'DigiLocker', doc_number: `RC-KA-${Date.now().toString().slice(-6)}` },
      { id: `doc_${userId}_4`, user_id: userId, name: 'Land Records (Pahani/RTC)', type: 'Property', status: 'Verified', source: 'DigiLocker', doc_number: `RTC-KA-2026-${Date.now().toString().slice(-4)}` }
    ];
    db.documents.createBatch(initialDocs);

    // 4. Generate JWT
    const token = jwt.sign(
      { userId, phone: cleanPhone, name: name.trim() },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userObj = {
      id: userId,
      name: name.trim(),
      phone: `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`,
      cleanPhone,
      email: userEmail,
      avatar,
      createdAt: now,
      fingerprintsCount: 0
    };

    return res.status(201).json({
      success: true,
      message: 'Citizen account created successfully',
      token,
      user: userObj,
      fingerprints: []
    });
  } catch (error) {
    console.error('Sign up error:', error);
    res.status(500).json({ error: 'Server error during sign up: ' + error.message });
  }
});

/**
 * POST /api/auth/signin
 * Sign in using Phone + Password OR Phone + Biometric Fingerprint
 */
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { phone, password, isBiometric, deviceId, deviceSecret } = req.body;

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
    }

    const user = db.users.findByPhone(cleanPhone);
    if (!user) {
      return res.status(404).json({ error: 'No citizen account found with this mobile number. Please sign up.' });
    }

    // Biometric Authentication - real, device-bound.
    // The client only reaches this branch after its OS BiometricPrompt / Face ID / Touch
    // ID has already confirmed the person's real, live fingerprint or face against what
    // is enrolled on that phone, and released a secret from the phone's secure hardware
    // storage. We never see or store the fingerprint itself - only proof that this exact
    // previously-registered device, unlocked by a real biometric check, is asking to sign in.
    if (isBiometric) {
      if (!deviceId || !deviceSecret) {
        return res.status(400).json({ error: 'Biometric sign-in requires this device to be registered first.' });
      }

      const device = db.biometricDevices.findByUserAndDevice(user.id, deviceId);
      if (!device) {
        return res.status(404).json({ error: 'Fingerprint sign-in is not enabled for this account on this device. Please sign in with your password and enable it from your profile.' });
      }

      const secretMatches = await bcrypt.compare(deviceSecret, device.secret_hash);
      if (!secretMatches) {
        return res.status(401).json({ error: 'Biometric verification failed. Please sign in with your password.' });
      }

      db.biometricDevices.updateLastUsed(user.id, deviceId);
    } else {
      // Password Authentication
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
      }
    }

    // Fetch registered biometric devices (metadata only, never the secret)
    const rawDevices = db.biometricDevices.findByUserId(user.id);
    const fingerprints = rawDevices.map(d => ({
      id: d.id,
      userId: d.user_id,
      deviceId: d.device_id,
      deviceName: d.device_name,
      enrolledAt: d.created_at,
      lastVerifiedAt: d.last_used_at
    }));

    const token = jwt.sign(
      { userId: user.id, phone: user.phone, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userObj = {
      id: user.id,
      name: user.name,
      phone: `+91 ${user.phone.slice(0, 5)} ${user.phone.slice(5)}`,
      cleanPhone: user.phone,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.created_at,
      fingerprintsCount: fingerprints.length
    };

    return res.json({
      success: true,
      message: isBiometric ? 'Biometric authentication successful' : 'Signed in successfully',
      token,
      user: userObj,
      fingerprints
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ error: 'Server error during sign in: ' + error.message });
  }
});

/**
 * POST /api/auth/biometric/register
 * Enable real fingerprint / Face ID sign-in on THIS device for the logged-in citizen.
 *
 * The mobile app only calls this after expo-local-authentication has already run a real
 * OS-level BiometricPrompt / Face ID check against the fingerprint(s)/face already
 * enrolled in that phone's Settings. On success, the phone generates a random secret,
 * seals it in the device's secure hardware keystore (Keychain / Android Keystore), and
 * sends it here once so the server can recognize this specific device next time. We
 * store only a bcrypt hash of that secret - never a fingerprint, never anything that can
 * be reversed into one.
 */
app.post('/api/auth/biometric/register', authenticateToken, async (req, res) => {
  try {
    const { deviceId, deviceName, secret } = req.body;

    if (!deviceId || !secret) {
      return res.status(400).json({ error: 'Missing device information from biometric enrollment.' });
    }

    const user = db.users.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existing = db.biometricDevices.findByUserAndDevice(user.id, deviceId);
    const secretHash = await bcrypt.hash(secret, 10);
    const now = new Date().toISOString();

    if (existing) {
      db.biometricDevices.updateSecret(user.id, deviceId, secretHash, deviceName);
    } else {
      db.biometricDevices.create({
        id: `bio_${user.id}_${Date.now()}`,
        user_id: user.id,
        device_id: deviceId,
        device_name: deviceName || 'Unnamed device',
        secret_hash: secretHash,
        created_at: now,
        last_used_at: now
      });
    }

    res.json({ success: true, message: 'Fingerprint sign-in enabled for this device' });
  } catch (error) {
    console.error('Biometric register error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/auth/biometric/:deviceId
 * Turn off fingerprint sign-in for a given device.
 */
app.delete('/api/auth/biometric/:deviceId', authenticateToken, async (req, res) => {
  try {
    const removed = db.biometricDevices.remove(req.user.userId, req.params.deviceId);
    res.json({ success: true, removed });
  } catch (error) {
    console.error('Biometric remove error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/biometric/status/:deviceId
 * Public check (no auth) so the sign-in screen knows whether to offer the "Sign in with
 * fingerprint" button for a given phone number + device before the user is logged in.
 */
app.get('/api/auth/biometric/status', async (req, res) => {
  try {
    const { phone, deviceId } = req.query;
    const cleanPhone = normalizePhone(phone);
    const user = db.users.findByPhone(cleanPhone);
    if (!user || !deviceId) {
      return res.json({ success: true, enabled: false });
    }
    const device = db.biometricDevices.findByUserAndDevice(user.id, deviceId);
    res.json({ success: true, enabled: !!device });
  } catch (error) {
    console.error('Biometric status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// USER PROFILE & BIOMETRIC DATA ROUTES
// ==========================================

/**
 * GET /api/user/profile
 * Get current user profile + biometric summary + documents count
 */
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = db.users.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const rawDevices = db.biometricDevices.findByUserId(user.id);
    const fingerprints = rawDevices.map(d => ({
      id: d.id,
      deviceId: d.device_id,
      deviceName: d.device_name,
      enrolledAt: d.created_at,
      lastVerifiedAt: d.last_used_at
    }));

    const docs = db.documents.findByUserId(user.id);
    const apps = db.applications.findByUserId(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: `+91 ${user.phone.slice(0, 5)} ${user.phone.slice(5)}`,
        cleanPhone: user.phone,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      fingerprints,
      stats: {
        documentsVerified: docs.length,
        applicationsCount: apps.length,
        biometricsRegistered: fingerprints.length
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/user/profile
 * Update user profile details
 */
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, avatar } = req.body;
    const currentUser = db.users.findById(req.user.userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedName = name && name.trim() ? name.trim() : currentUser.name;
    const updatedEmail = email !== undefined ? email.trim() : currentUser.email;
    const updatedAvatar = avatar || currentUser.avatar;

    const updatedUser = db.users.update(req.user.userId, {
      name: updatedName,
      email: updatedEmail,
      avatar: updatedAvatar
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: `+91 ${updatedUser.phone.slice(0, 5)} ${updatedUser.phone.slice(5)}`,
        cleanPhone: updatedUser.phone,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        updatedAt: updatedUser.updated_at
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/user/fingerprints
 * List devices that have real fingerprint / Face ID sign-in enabled for this citizen.
 */
app.get('/api/user/fingerprints', authenticateToken, async (req, res) => {
  try {
    const rawDevices = db.biometricDevices.findByUserId(req.user.userId);
    const fingerprints = rawDevices.map(d => ({
      id: d.id,
      deviceId: d.device_id,
      deviceName: d.device_name,
      enrolledAt: d.created_at,
      lastVerifiedAt: d.last_used_at
    }));

    res.json({
      success: true,
      fingerprints,
      totalEnrolled: fingerprints.length
    });
  } catch (error) {
    console.error('Get fingerprints error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// SCHEMES, APPLICATIONS & DOCUMENTS ROUTES
// ==========================================

/**
 * GET /api/schemes
 * Return list of all available schemes
 */
app.get('/api/schemes', (req, res) => {
  res.json({
    success: true,
    schemes: SCHEMES_DATA
  });
});

/**
 * GET /api/applications
 * Return all applications for logged-in citizen
 */
app.get('/api/applications', authenticateToken, async (req, res) => {
  try {
    const apps = db.applications.findByUserId(req.user.userId);
    const formattedApps = apps.map(app => ({
      id: app.id,
      schemeId: app.scheme_id,
      schemeName: app.scheme_name,
      submittedDate: app.submitted_date,
      status: app.status,
      currentStep: app.current_step,
      steps: typeof app.steps_json === 'string' ? JSON.parse(app.steps_json || '[]') : (app.steps_json || [])
    }));

    res.json({
      success: true,
      applications: formattedApps
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/applications
 * Submit a new scheme application
 */
app.post('/api/applications', authenticateToken, async (req, res) => {
  try {
    const { schemeId, schemeName } = req.body;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const appId = `${(schemeId || 'APP').toUpperCase().replace(/[^A-Z0-9]/g, '')}${now.getFullYear()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const defaultSteps = [
      { title: 'Application Submitted', status: 'Completed', date: formattedDate },
      { title: 'Documents Verified', status: 'Completed', date: formattedDate },
      { title: 'Under Review', status: 'In Progress', date: `Since ${formattedDate}` },
      { title: 'Approved', status: 'Pending' },
      { title: 'Benefits Disbursed', status: 'Pending' }
    ];

    const newApp = db.applications.create({
      id: appId,
      user_id: req.user.userId,
      scheme_id: schemeId || 'pm-kisan',
      scheme_name: schemeName || 'PM-KISAN Samman Nidhi',
      submitted_date: formattedDate,
      status: 'Under Review',
      current_step: 3,
      steps_json: JSON.stringify(defaultSteps),
      created_at: now.toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        id: appId,
        schemeId,
        schemeName,
        submittedDate: formattedDate,
        status: 'Under Review',
        currentStep: 3,
        steps: defaultSteps
      }
    });
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/documents
 * Return citizen's DigiLocker & verified documents
 */
app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    const docs = db.documents.findByUserId(req.user.userId);
    const formattedDocs = docs.map(d => ({
      id: d.id,
      name: d.name,
      type: d.type,
      status: d.status,
      source: d.source,
      docNumber: d.doc_number
    }));

    res.json({
      success: true,
      documents: formattedDocs
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Sugam Seva Backend Database & API Server Running`);
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});