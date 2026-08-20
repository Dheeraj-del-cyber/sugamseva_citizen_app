import React, { useState, useEffect } from 'react';
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
import { BiometricScannerModal } from '../components/BiometricScannerModal';

export const AuthScreen: React.FC = () => {
  const { t, activeLanguage, setLanguage, availableLanguages } = useAppNavigation();
  const {
    signIn,
    signUp,
    signInWithBiometrics,
    checkDeviceHasBiometricEnabled,
    isLoading,
    authError,
    clearError,
    biometricAvailableOnThisDevice,
  } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In Form State
  const [signInPhone, setSignInPhone] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInBiometricEnabled, setSignInBiometricEnabled] = useState(false);

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Biometric sign-in prompt modal state
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerPurpose] = useState<'enroll' | 'signin'>('signin');

  const handleTabChange = (mode: 'signin' | 'signup') => {
    clearError();
    setAuthMode(mode);
  };

  // As the person types their sign-in phone number, check (locally + server) whether
  // fingerprint sign-in was already enabled for that account on this exact device.
  useEffect(() => {
    let cancelled = false;
    const digits = signInPhone.replace(/\D/g, '');
    if (digits.length === 10 && biometricAvailableOnThisDevice) {
      checkDeviceHasBiometricEnabled(digits).then(enabled => {
        if (!cancelled) setSignInBiometricEnabled(enabled);
      });
    } else {
      setSignInBiometricEnabled(false);
    }
    return () => { cancelled = true; };
  }, [signInPhone, biometricAvailableOnThisDevice]);

  const handleSignInSubmit = async () => {
    if (!signInPhone.trim() || !signInPassword.trim()) {
      Alert.alert(t('missingFields'), t('pleaseCompleteForm'));
      return;
    }
    await signIn(signInPhone, signInPassword);
  };

  const handleBiometricSignIn = async () => {
    if (!signInPhone.trim()) {
      Alert.alert(t('phoneRequired'), t('phoneRequiredMessage'));
      return;
    }
    setScannerVisible(true);
  };

  const handleScannerResult = async (result: { success: boolean; error?: string }) => {
    if (!result.success) return;
    await signInWithBiometrics(signInPhone);
    setScannerVisible(false);
  };

  const handleSignUpSubmit = async () => {
    if (!signUpName.trim() || !signUpPhone.trim() || !signUpPassword.trim() || !signUpConfirmPassword.trim()) {
      Alert.alert(t('missingFields'), t('pleaseCompleteForm'));
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      Alert.alert(t('passwordError'), t('passwordsDoNotMatch'));
      return;
    }

    if (signUpPassword.length < 6) {
      Alert.alert(t('passwordError'), t('passwordTooShort'));
      return;
    }

    // signUp sets appPhase to 'post-auth-gate' on success — no extra action needed here
    await signUp({
      name: signUpName.trim(),
      phone: signUpPhone.trim(),
      password: signUpPassword,
    });
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langPills} contentContainerStyle={styles.langPillsContent}>
          {availableLanguages.map(lang => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => setLanguage(lang.code)}
              style={[
                styles.langPill,
                activeLanguage === lang.code && styles.langPillActive
              ]}
            >
              <Text
                style={[
                  styles.langPillText,
                  activeLanguage === lang.code && styles.langPillTextActive
                ]}
              >
                {lang.code.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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

            {/* Real Biometric Quick Sign In - only shown once we've confirmed this
                device already has fingerprint sign-in enabled for the typed phone number */}
            {signInBiometricEnabled && (
              <>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>{t('orSignInWith')}</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  onPress={handleBiometricSignIn}
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
              </>
            )}

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
        {/* SIGN UP FORM */}
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

            <View style={styles.infoNote}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.infoNoteText}>
                You can turn on fingerprint / Face ID sign-in for this device right after creating your account.
              </Text>
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

        {/* Biometric enrollment is now handled in PostAuthGateScreen after sign-in */}
      </ScrollView>

      {/* Real OS Biometric Prompt */}
      <BiometricScannerModal
        visible={scannerVisible}
        purpose={scannerPurpose}
        promptMessage={scannerPurpose === 'enroll' ? 'Confirm your fingerprint to enable fingerprint sign-in' : 'Sign in to Sugam Seva'}
        onClose={() => setScannerVisible(false)}
        onResult={handleScannerResult}
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
    maxWidth: 170,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
  },
  langPillsContent: {
    flexDirection: 'row',
    padding: 3,
  },
  langPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    marginRight: 2,
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
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoNoteText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 8,
    flex: 1,
    lineHeight: 17,
  },
});
export default AuthScreen;