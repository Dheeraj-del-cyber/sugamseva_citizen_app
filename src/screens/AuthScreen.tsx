import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAppNavigation } from '../navigation/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { FingerprintEnrollmentData } from '../types';
import { BiometricScannerModal } from '../components/BiometricScannerModal';

const INITIAL_FINGERS: FingerprintEnrollmentData[] = [
  { fingerIndex: 0, fingerName: 'Right Thumb', fingerLabelKey: 'rightThumb', isScanned: false },
  { fingerIndex: 1, fingerName: 'Right Index', fingerLabelKey: 'rightIndex', isScanned: false },
  { fingerIndex: 2, fingerName: 'Left Thumb', fingerLabelKey: 'leftThumb', isScanned: false },
  { fingerIndex: 3, fingerName: 'Left Index', fingerLabelKey: 'leftIndex', isScanned: false },
];

export const AuthScreen: React.FC = () => {
  const { t, activeLanguage, setLanguage } = useAppNavigation();
  const { signIn, signUp, signInWithBiometrics, isLoading, authError, clearError } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In Form State
  const [signInPhone, setSignInPhone] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [enrolledFingers, setEnrolledFingers] = useState<FingerprintEnrollmentData[]>(INITIAL_FINGERS);

  // Scanner Modal State
  const [scannerVisible, setScannerVisible] = useState(false);
  const [activeScanIndex, setActiveScanIndex] = useState<number>(0);
  const [isBiometricLoginScan, setIsBiometricLoginScan] = useState(false);

  // Switch tabs
  const handleTabChange = (mode: 'signin' | 'signup') => {
    clearError();
    setAuthMode(mode);
  };

  // Open scanner for specific finger
  const openFingerScanner = (index: number) => {
    setIsBiometricLoginScan(false);
    setActiveScanIndex(index);
    setScannerVisible(true);
  };

  // Open scanner for Biometric Sign In
  const openBiometricSignInScanner = () => {
    if (!signInPhone.trim()) {
      Alert.alert("Phone Required", "Please enter your registered mobile number first to authenticate with fingerprint.");
      return;
    }
    setIsBiometricLoginScan(true);
    setActiveScanIndex(0);
    setScannerVisible(true);
  };

  // Handle Scan Completed
  const handleScanComplete = (
    index: number,
    scanData: { fingerName: string; biometricTemplate: string; scanQuality: number; scannedAt: string }
  ) => {
    if (isBiometricLoginScan) {
      setScannerVisible(false);
      // Perform biometric login
      signInWithBiometrics(signInPhone, index);
    } else {
      setEnrolledFingers(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          isScanned: true,
          biometricTemplate: scanData.biometricTemplate,
          scanQuality: scanData.scanQuality,
          scannedAt: scanData.scannedAt
        };
        return updated;
      });
    }
  };

  // Handle Next Finger in Scanner
  const handleScanNext = () => {
    if (activeScanIndex < 3) {
      setActiveScanIndex(activeScanIndex + 1);
    } else {
      setScannerVisible(false);
    }
  };

  // Auto-scan all 4 fingers sequentially
  const handleScanAllFingers = () => {
    setIsBiometricLoginScan(false);
    setActiveScanIndex(0);
    setScannerVisible(true);
  };

  // Handle Sign In Submit
  const handleSignInSubmit = async () => {
    if (!signInPhone.trim() || !signInPassword.trim()) {
      Alert.alert("Missing Fields", t('pleaseCompleteForm'));
      return;
    }
    await signIn(signInPhone, signInPassword);
  };

  // Handle Sign Up Submit
  const handleSignUpSubmit = async () => {
    if (!signUpName.trim() || !signUpPhone.trim() || !signUpPassword.trim() || !signUpConfirmPassword.trim()) {
      Alert.alert("Missing Fields", t('pleaseCompleteForm'));
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      Alert.alert("Password Error", t('passwordsDoNotMatch'));
      return;
    }

    if (signUpPassword.length < 6) {
      Alert.alert("Password Error", t('passwordTooShort'));
      return;
    }

    // Verify all 4 fingers scanned
    const allScanned = enrolledFingers.every(f => f.isScanned);
    if (!allScanned) {
      Alert.alert("Biometric Enrollment Required", t('allFingersRequired'));
      return;
    }

    const fingerprintsPayload = enrolledFingers.map(f => ({
      fingerIndex: f.fingerIndex,
      fingerName: f.fingerName,
      biometricTemplate: f.biometricTemplate,
      scanQuality: f.scanQuality || 98
    }));

    await signUp({
      name: signUpName.trim(),
      phone: signUpPhone.trim(),
      password: signUpPassword,
      fingerprints: fingerprintsPayload
    });
  };

  const scannedCount = enrolledFingers.filter(f => f.isScanned).length;

  const getFingerLabel = (key?: string, defaultName?: string) => {
    if (key && (t as any)(key)) {
      return (t as any)(key);
    }
    return defaultName || 'Finger';
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Header Banner */}
      <View style={styles.topHeader}>
        <View style={styles.brandingRow}>
          <View style={styles.emblemBadge}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.brandTitle}>{t('appName')}</Text>
            <Text style={styles.brandSubtitle}>{t('appSubtitle')}</Text>
          </View>
        </View>

        {/* Language Selector */}
        <View style={styles.langPills}>
          {(['en', 'kn', 'hi'] as const).map(lang => (
            <TouchableOpacity
              key={lang}
              onPress={() => setLanguage(lang)}
              style={[
                styles.langPill,
                activeLanguage === lang && styles.langPillActive
              ]}
            >
              <Text
                style={[
                  styles.langPillText,
                  activeLanguage === lang && styles.langPillTextActive
                ]}
              >
                {lang === 'en' ? 'EN' : lang === 'kn' ? 'KN' : 'HI'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Auth Mode Segmented Tab */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => handleTabChange('signin')}
            style={[styles.tabItem, authMode === 'signin' && styles.tabItemActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, authMode === 'signin' && styles.tabTextActive]}>
              {t('signIn')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleTabChange('signup')}
            style={[styles.tabItem, authMode === 'signup' && styles.tabItemActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, authMode === 'signup' && styles.tabTextActive]}>
              {t('signUp')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Global Error Banner */}
        {authError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={styles.errorBannerText}>{authError}</Text>
          </View>
        )}

        {/* ================================================= */}
        {/* SIGN IN FORM */}
        {/* ================================================= */}
        {authMode === 'signin' && (
          <View style={styles.formCard}>
            <Text style={styles.formHeaderTitle}>{t('signInTitle')}</Text>
            <Text style={styles.formHeaderSubtitle}>{t('signInSubtitle')}</Text>

            {/* Mobile Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('phoneNumber')} *</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>+91</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('phonePlaceholder')}
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={signInPhone}
                  onChangeText={setSignInPhone}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('password')} *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder={t('passwordPlaceholder')}
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showSignInPassword}
                  value={signInPassword}
                  onChangeText={setSignInPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowSignInPassword(!showSignInPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showSignInPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={handleSignInSubmit}
              disabled={isLoading}
              style={[styles.submitButton, isLoading && styles.buttonDisabled]}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                  <Text style={styles.submitButtonText}>{t('signInBtn')}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('orSignInWith')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Biometric Quick Sign In Button */}
            <TouchableOpacity
              onPress={openBiometricSignInScanner}
              disabled={isLoading}
              style={styles.biometricLoginCard}
              activeOpacity={0.8}
            >
              <View style={styles.bioIconCircle}>
                <MaterialCommunityIcons name="fingerprint" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.bioLoginTextWrap}>
                <Text style={styles.bioLoginTitle}>{t('biometricSignIn')}</Text>
                <Text style={styles.bioLoginSubtitle}>{t('biometricAuthPrompt')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
            </TouchableOpacity>

            {/* Switch to Sign Up */}
            <TouchableOpacity
              onPress={() => handleTabChange('signup')}
              style={styles.switchTabBtn}
            >
              <Text style={styles.switchTabText}>
                {t('dontHaveAccount')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================================================= */}
        {/* SIGN UP FORM (WITH 4-FINGER BIOMETRIC TRACKING) */}
        {/* ================================================= */}
        {authMode === 'signup' && (
          <View style={styles.formCard}>
            <Text style={styles.formHeaderTitle}>{t('signUpTitle')}</Text>
            <Text style={styles.formHeaderSubtitle}>{t('signUpSubtitle')}</Text>

            {/* Full Legal Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('fullName')} *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder={t('fullNamePlaceholder')}
                  placeholderTextColor="#94A3B8"
                  value={signUpName}
                  onChangeText={setSignUpName}
                />
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('phoneNumber')} *</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>+91</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('phonePlaceholder')}
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={signUpPhone}
                  onChangeText={setSignUpPhone}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('password')} *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder={t('passwordPlaceholder')}
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showSignUpPassword}
                  value={signUpPassword}
                  onChangeText={setSignUpPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowSignUpPassword(!showSignUpPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showSignUpPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('confirmPassword')} *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="shield-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder={t('confirmPasswordPlaceholder')}
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showSignUpPassword}
                  value={signUpConfirmPassword}
                  onChangeText={setSignUpConfirmPassword}
                />
              </View>
            </View>

            {/* ======================================= */}
            {/* 4-FINGER BIOMETRIC ENROLLMENT SECTION */}
            {/* ======================================= */}
            <View style={styles.biometricSection}>
              <View style={styles.biometricSectionHeader}>
                <View style={styles.bioSectionTitleRow}>
                  <MaterialCommunityIcons name="fingerprint" size={22} color={COLORS.primary} />
                  <Text style={styles.biometricSectionTitle}>{t('biometricEnrollmentTitle')}</Text>
                </View>
                <View style={[styles.scannedCountPill, scannedCount === 4 && styles.scannedCountPillFull]}>
                  <Text style={[styles.scannedCountText, scannedCount === 4 && styles.scannedCountTextFull]}>
                    {scannedCount}/4 Captured
                  </Text>
                </View>
              </View>
              <Text style={styles.biometricSectionSub}>{t('biometricEnrollmentSub')}</Text>

              {/* Quick Action: Scan All */}
              {scannedCount < 4 && (
                <TouchableOpacity
                  onPress={handleScanAllFingers}
                  style={styles.scanAllBannerBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="sparkles" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.scanAllBannerText}>Start Sequential 4-Finger Scanner</Text>
                </TouchableOpacity>
              )}

              {/* 4 Fingers Grid */}
              <View style={styles.fingersGrid}>
                {enrolledFingers.map((finger, idx) => (
                  <TouchableOpacity
                    key={finger.fingerIndex}
                    onPress={() => openFingerScanner(idx)}
                    style={[
                      styles.fingerCard,
                      finger.isScanned && styles.fingerCardScanned
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={styles.fingerCardHeader}>
                      <View style={[styles.fingerIconCircle, finger.isScanned && styles.fingerIconCircleScanned]}>
                        <MaterialCommunityIcons
                          name="fingerprint"
                          size={28}
                          color={finger.isScanned ? '#10B981' : '#64748B'}
                        />
                      </View>
                      {finger.isScanned ? (
                        <View style={styles.scannedBadge}>
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        </View>
                      ) : (
                        <View style={styles.pendingBadge}>
                          <Text style={styles.pendingBadgeText}>{idx + 1}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.fingerNameText} numberOfLines={1}>
                      {getFingerLabel(finger.fingerLabelKey, finger.fingerName)}
                    </Text>

                    <View style={styles.fingerStatusWrap}>
                      {finger.isScanned ? (
                        <Text style={styles.fingerQualityText}>Quality: {finger.scanQuality}%</Text>
                      ) : (
                        <Text style={styles.fingerActionText}>Tap to Scan</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Seal Indicator */}
              {scannedCount === 4 && (
                <View style={styles.sealedBanner}>
                  <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                  <Text style={styles.sealedBannerText}>
                    All 4 Biometrics Ready & Cryptographically Encrypted
                  </Text>
                </View>
              )}
            </View>

            {/* Create Account Button */}
            <TouchableOpacity
              onPress={handleSignUpSubmit}
              disabled={isLoading}
              style={[styles.submitButton, isLoading && styles.buttonDisabled]}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                  <Text style={styles.submitButtonText}>{t('createAccountBtn')}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Switch to Sign In */}
            <TouchableOpacity
              onPress={() => handleTabChange('signin')}
              style={styles.switchTabBtn}
            >
              <Text style={styles.switchTabText}>
                {t('haveAccount')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Interactive Biometric Scanner Modal */}
      <BiometricScannerModal
        visible={scannerVisible}
        fingerIndex={activeScanIndex}
        fingerName={
          isBiometricLoginScan
            ? "Biometric Login Sensor"
            : getFingerLabel(enrolledFingers[activeScanIndex]?.fingerLabelKey, enrolledFingers[activeScanIndex]?.fingerName)
        }
        onClose={() => setScannerVisible(false)}
        onScanComplete={handleScanComplete}
        onScanNext={handleScanNext}
        hasNextFinger={!isBiometricLoginScan && activeScanIndex < 3}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emblemBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  brandSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  langPills: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 3,
  },
  langPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  langPillActive: {
    backgroundColor: COLORS.primary,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
  },
  langPillTextActive: {
    color: COLORS.white,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  formHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  formHeaderSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    height: 48,
  },
  phonePrefix: {
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    marginRight: 8,
  },
  phonePrefixText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: COLORS.textDark,
  },
  eyeBtn: {
    padding: 6,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    paddingHorizontal: 12,
  },
  biometricLoginCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  bioIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bioLoginTextWrap: {
    flex: 1,
  },
  bioLoginTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bioLoginSubtitle: {
    fontSize: 11,
    color: '#065F46',
    marginTop: 2,
  },
  switchTabBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  switchTabText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // 4-Finger Biometric Enrollment
  biometricSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 16,
  },
  biometricSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bioSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  biometricSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginLeft: 6,
  },
  scannedCountPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  scannedCountPillFull: {
    backgroundColor: '#DCFCE7',
  },
  scannedCountText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
  },
  scannedCountTextFull: {
    color: '#15803D',
  },
  biometricSectionSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 12,
  },
  scanAllBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  scanAllBannerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  fingersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fingerCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  fingerCardScanned: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  fingerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fingerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerIconCircleScanned: {
    backgroundColor: '#DCFCE7',
  },
  pendingBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
  },
  scannedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerNameText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  fingerStatusWrap: {
    marginTop: 4,
  },
  fingerActionText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  fingerQualityText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: 'bold',
  },
  sealedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  sealedBannerText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
});
export default AuthScreen;
