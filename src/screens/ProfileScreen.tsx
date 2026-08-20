import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAppNavigation } from '../navigation/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { BiometricScannerModal } from '../components/BiometricScannerModal';

export const ProfileScreen = () => {
  const { t, activeLanguage, setLanguage, availableLanguages, pushScreen, setTab, resetNavigation } = useAppNavigation();
  const [langModalVisible, setLangModalVisible] = useState(false);
  const {
    user,
    fingerprints,
    logout,
    updateProfile,
    isLoading,
    biometricAvailableOnThisDevice,
    biometricEnabledOnThisDevice,
    enableBiometricSignIn,
    disableBiometricSignIn,
  } = useAuth();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showBiometricsDetails, setShowBiometricsDetails] = useState(false);
  const [biometricScannerVisible, setBiometricScannerVisible] = useState(false);

  const handleToggleBiometric = () => {
    if (biometricEnabledOnThisDevice) {
      Alert.alert(
        t('turnOffBiometricTitle'),
        t('turnOffBiometricDesc'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('turnOff'), style: 'destructive', onPress: () => disableBiometricSignIn() },
        ]
      );
      return;
    }

    if (!biometricAvailableOnThisDevice) {
      Alert.alert(t('notAvailable'), t('noBiometricHardware'));
      return;
    }

    setBiometricScannerVisible(true);
  };

  const handleBiometricEnrollResult = async (result: { success: boolean; error?: string }) => {
    if (result.success) {
      const res = await enableBiometricSignIn();
      setBiometricScannerVisible(false);
      if (!res.success) {
        Alert.alert(t('couldNotEnableBiometric'), res.error || t('pleaseTryAgain'));
      }
    } else {
      setBiometricScannerVisible(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('logout'),
          style: "destructive",
          onPress: () => {
            logout();
            resetNavigation('Home');
          }
        }
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert(t('nameRequired'), t('nameRequiredMessage'));
      return;
    }

    setIsUpdating(true);
    const success = await updateProfile({
      name: editName.trim(),
      email: editEmail.trim(),
    });
    setIsUpdating(false);

    if (success) {
      setEditModalVisible(false);
      Alert.alert(t('success'), t('profileUpdated'));
    }
  };

  const getLanguageName = () => {
    const lang = availableLanguages.find((l) => l.code === activeLanguage);
    return lang ? lang.nativeName : 'English';
  };

  const menuOptions = [
    {
      icon: 'language-outline',
      label: t('languageOpt'),
      rightText: getLanguageName(),
      onPress: () => setLangModalVisible(true)
    },
    {
      icon: 'folder-open-outline',
      label: t('myDocuments'),
      rightText: t('digiLocker'),
      onPress: () => pushScreen('DigiLocker')
    },
    {
      icon: 'document-text-outline',
      label: t('myApplications'),
      onPress: () => setTab('Track')
    },
    {
      icon: 'notifications-outline',
      label: t('myAlerts'),
      onPress: () => Alert.alert(t('myAlerts'), t('myAlertsEmpty'))
    },
    {
      icon: 'help-circle-outline',
      label: t('helpSupport'),
      onPress: () => Alert.alert(t('helpSupport'), t('helpSupportDesc'))
    },
    {
      icon: 'settings-outline',
      label: t('settings'),
      onPress: () => Alert.alert(t('settings'), t('appPreferences'))
    },
    {
      icon: 'information-circle-outline',
      label: t('aboutSugam'),
      onPress: () => Alert.alert(t('about'), t('aboutAppDesc'))
    }
  ];

  const defaultAvatar = `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(user?.name || 'Citizen')}&backgroundColor=047857`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header Green Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: user?.avatar || defaultAvatar }} style={styles.avatar} />
          <TouchableOpacity
            onPress={() => {
              setEditName(user?.name || '');
              setEditEmail(user?.email || '');
              setEditModalVisible(true);
            }}
            style={styles.editBadge}
            accessibilityLabel="Edit Profile"
          >
            <Ionicons name="pencil" size={11} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{user?.name || t('defaultCitizenName')}</Text>
          <Text style={styles.userPhone}>{user?.phone || 'Mobile not set'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@sugamseva.gov.in'}</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            setEditName(user?.name || '');
            setEditEmail(user?.email || '');
            setEditModalVisible(true);
          }}
          style={styles.arrowButton}
          accessibilityLabel="Edit profile details"
        >
          <Ionicons name="create-outline" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Real Fingerprint / Face ID Sign-In Card */}
      <View style={styles.biometricRegistryCard}>
        <TouchableOpacity
          onPress={() => setShowBiometricsDetails(!showBiometricsDetails)}
          style={styles.biometricHeaderRow}
          activeOpacity={0.8}
        >
          <View style={styles.bioIconCircle}>
            <MaterialCommunityIcons name="fingerprint" size={26} color="#059669" />
          </View>
          <View style={styles.bioInfoText}>
            <View style={styles.bioTitleRow}>
              <Text style={styles.bioCardTitle}>{t('biometricSignInCardTitle')}</Text>
              <View style={[styles.bioActiveBadge, !biometricEnabledOnThisDevice && styles.bioInactiveBadge]}>
                <Text style={[styles.bioActiveText, !biometricEnabledOnThisDevice && styles.bioInactiveText]}>
                  {biometricEnabledOnThisDevice ? t('onForDevice') : t('offForDevice')}
                </Text>
              </View>
            </View>
            <Text style={styles.bioCardSub}>
              {fingerprints.length > 0
                ? t('devicesEnrolled', { count: String(fingerprints.length) })
                : t('biometricSensorHint')}
            </Text>
          </View>
          <Ionicons
            name={showBiometricsDetails ? "chevron-up" : "chevron-down"}
            size={20}
            color="#059669"
          />
        </TouchableOpacity>

        {showBiometricsDetails && (
          <View style={styles.bioDetailList}>
            <View style={styles.bioDivider} />

            {fingerprints.length === 0 ? (
              <Text style={styles.bioEmptyText}>{t('noBiometricDevices')}</Text>
            ) : (
              fingerprints.map((fp) => (
                <View key={fp.id} style={styles.fingerprintRow}>
                  <View style={styles.fpLeft}>
                    <View style={styles.fpMiniIcon}>
                      <MaterialCommunityIcons name="cellphone" size={18} color="#059669" />
                    </View>
                    <View>
                      <Text style={styles.fpName}>{fp.deviceName}</Text>
                      <Text style={styles.fpMeta}>
                        {t('lastUsed', { date: fp.lastVerifiedAt ? new Date(fp.lastVerifiedAt).toLocaleDateString() : '—' })}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                </View>
              ))
            )}

            <TouchableOpacity
              onPress={handleToggleBiometric}
              disabled={isLoading}
              style={[styles.bioToggleBtn, biometricEnabledOnThisDevice && styles.bioToggleBtnOff]}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="fingerprint"
                size={18}
                color={biometricEnabledOnThisDevice ? '#DC2626' : COLORS.white}
              />
              <Text style={[styles.bioToggleBtnText, biometricEnabledOnThisDevice && styles.bioToggleBtnTextOff]}>
                {biometricEnabledOnThisDevice ? t('turnOffOnDevice') : t('enableOnDevice')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <BiometricScannerModal
        visible={biometricScannerVisible}
        purpose="enroll"
        promptMessage={t('confirmFingerprintPrompt')}
        onClose={() => setBiometricScannerVisible(false)}
        onResult={handleBiometricEnrollResult}
      />

      {/* Settings Options List */}
      <View style={styles.optionsCard}>
        {menuOptions.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={opt.onPress}
            style={[
              styles.optionItem,
              idx === menuOptions.length - 1 && styles.optionItemLast
            ]}
          >
            <View style={styles.optionLeft}>
              <View style={styles.optionIconCircle}>
                <Ionicons name={opt.icon as any} size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.optionLabel}>{opt.label}</Text>
            </View>

            <View style={styles.optionRight}>
              {opt.rightText && (
                <Text style={styles.optionRightText}>{opt.rightText}</Text>
              )}
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={handleLogout}
        style={styles.logoutButton}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={18} color={COLORS.danger} style={{ marginRight: 6 }} />
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('editProfileTitle')}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={22} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>{t('fullName')}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder={t('fullNamePlaceholder')}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>{t('emailAddress')}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>{t('phoneNumber')}</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalInputDisabled]}
                  value={user?.phone || ''}
                  editable={false}
                />
                <Text style={styles.modalHelperText}>{t('mobileLinkedNote')}</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={isUpdating}
                style={styles.modalSaveBtn}
              >
                {isUpdating ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalSaveText}>{t('save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={langModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLangModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.langModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                <Ionicons name="close" size={22} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.langModalScroll} showsVerticalScrollIndicator={false}>
              {availableLanguages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langModalRow,
                    activeLanguage === lang.code && styles.langModalRowActive
                  ]}
                  onPress={() => {
                    setLanguage(lang.code);
                    setLangModalVisible(false);
                  }}
                >
                  <Text style={[styles.langModalRowText, activeLanguage === lang.code && styles.langModalRowTextActive]}>
                    {lang.nativeName} {lang.nativeName !== lang.name ? `(${lang.name})` : ''}
                  </Text>
                  {activeLanguage === lang.code && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeaderCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.white,
    backgroundColor: '#065F46',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#065F46',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  userPhone: {
    fontSize: 12,
    color: COLORS.primaryLight,
    marginTop: 4,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 11,
    color: '#D1FAE5',
    marginTop: 2,
  },
  arrowButton: {
    padding: 8,
  },

  // Biometric Registry Card
  biometricRegistryCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#059669',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  biometricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bioIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bioInfoText: {
    flex: 1,
  },
  bioTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bioCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#065F46',
  },
  bioActiveBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  bioActiveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#15803D',
  },
  bioInactiveBadge: {
    backgroundColor: '#F1F5F9',
  },
  bioInactiveText: {
    color: '#64748B',
  },
  bioEmptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    paddingVertical: 8,
  },
  bioToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 10,
  },
  bioToggleBtnOff: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  bioToggleBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bioToggleBtnTextOff: {
    color: '#DC2626',
  },
  bioCardSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    lineHeight: 15,
  },
  bioDetailList: {
    marginTop: 12,
  },
  bioDivider: {
    height: 1,
    backgroundColor: '#BBF7D0',
    marginBottom: 10,
  },
  fingerprintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  fpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fpMiniIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fpName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  fpMeta: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  fpRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fpQualityBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  fpQualityText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#059669',
  },

  optionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionItemLast: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionRightText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: 6,
  },
  logoutButton: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    flexDirection: 'row',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.danger,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
  },
  langModalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '75%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
  },
  langModalScroll: {
    marginTop: 4,
  },
  langModalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  langModalRowActive: {
    backgroundColor: '#ECFDF5',
  },
  langModalRowText: {
    fontSize: 15,
    color: COLORS.textDark,
  },
  langModalRowTextActive: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalInputGroup: {
    marginBottom: 14,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: COLORS.textDark,
    backgroundColor: '#F8FAFC',
  },
  modalInputDisabled: {
    backgroundColor: '#E2E8F0',
    color: '#64748B',
  },
  modalHelperText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
  },
  modalCancelText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  modalSaveText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
export default ProfileScreen;