import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useAppNavigation } from '../navigation/NavigationContext';
import * as ImagePicker from 'expo-image-picker';

const DOCUMENT_TYPES = [
  { label: 'Aadhaar Card', icon: 'card-outline' },
  { label: 'PAN Card', icon: 'document-text-outline' },
  { label: 'Driving Licence', icon: 'car-outline' },
  { label: 'Passport', icon: 'airplane-outline' },
  { label: 'Voter ID', icon: 'people-outline' },
  { label: 'Other Document', icon: 'folder-outline' },
];

interface CapturedDoc {
  id: string;
  type: string;
  uri: string;
}

/**
 * OnboardingScreen
 *
 * Shown only on a user's first login.  Two-step wizard:
 *   Step 1 — Confirm / update personal details (name + email)
 *   Step 2 — Upload documents or connect DigiLocker
 *
 * The user can always tap "Continue" to skip optional steps.
 * On completion, `markOnboardingDone()` is called, which persists the flag
 * and routes to the main app.
 */
export const OnboardingScreen: React.FC = () => {
  const { user, updateProfile, markOnboardingDone, isLoading } = useAuth();
  const { pushScreen, currentScreen, popScreen } = useAppNavigation();

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 — Profile details
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);

  // Step 2 — Documents
  const [documents, setDocuments] = useState<CapturedDoc[]>([]);
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<'gallery' | 'camera' | null>(null);

  // Receive a document returned from DocumentCaptureScreen via params
  useEffect(() => {
    const params = currentScreen.params;
    if (params?.newDocument) {
      const newDoc: CapturedDoc = params.newDocument;
      setDocuments(prev => {
        if (params.replaceId) {
          return prev.map(d => d.id === params.replaceId ? newDoc : d);
        }
        return [...prev, newDoc];
      });
      // Clear params so it doesn't re-run on next render
      params.newDocument = null;
      params.replaceId = null;
    }
  }, [currentScreen.params]);

  // ── Step 1: save profile and advance ──────────────────────────────────────
  const handleSaveAndNext = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    setIsSaving(true);
    await updateProfile({ name: name.trim(), email: email.trim() });
    setIsSaving(false);
    setStep(2);
  };

  // ── Step 2: document capture ───────────────────────────────────────────────
  const handleSelectType = async (type: string) => {
    setTypeModalVisible(false);
    
    if (pendingAction === 'camera') {
      pushScreen('DocumentCapture', { documentType: type });
    } else if (pendingAction === 'gallery') {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const newDoc: CapturedDoc = {
            id: Date.now().toString(),
            type,
            uri: result.assets[0].uri,
          };
          setDocuments(prev => [...prev, newDoc]);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to pick image from gallery.');
      }
    }
    setPendingAction(null);
  };

  const handleDeleteDoc = (id: string) => {
    Alert.alert('Remove document', 'Remove this document from your profile?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setDocuments(prev => prev.filter(d => d.id !== id)) },
    ]);
  };

  // ── Finish onboarding ──────────────────────────────────────────────────────
  const handleFinish = async () => {
    await markOnboardingDone();
  };

  // ── Step indicator ─────────────────────────────────────────────────────────
  const StepIndicator = () => (
    <View style={styles.stepIndicator}>
      {([1, 2] as const).map(s => (
        <React.Fragment key={s}>
          <View style={[styles.stepDot, step === s && styles.stepDotActive, step > s && styles.stepDotDone]}>
            {step > s ? (
              <Ionicons name="checkmark" size={12} color={COLORS.white} />
            ) : (
              <Text style={[styles.stepDotText, step === s && styles.stepDotTextActive]}>{s}</Text>
            )}
          </View>
          {s < 2 && (
            <View style={[styles.stepLine, step > s && styles.stepLineDone]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1 — Personal Details
  // ══════════════════════════════════════════════════════════════════════════
  const renderStep1 = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.stepHeader}>
          <View style={styles.stepIconBadge}>
            <Ionicons name="person-circle-outline" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.stepTitle}>Confirm Your Details</Text>
          <Text style={styles.stepSubtitle}>
            Please verify your name and email so we can personalise your experience.
          </Text>
        </View>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Your full legal name"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Phone (read-only) */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Mobile Number</Text>
          <View style={[styles.inputWrapper, styles.inputWrapperDisabled]}>
            <Ionicons name="call-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, { color: COLORS.textMuted }]}
              value={user?.phone || ''}
              editable={false}
            />
            <Ionicons name="lock-closed-outline" size={14} color="#CBD5E1" />
          </View>
          <Text style={styles.helperText}>Mobile number is linked to your Aadhaar and cannot be changed.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, (isSaving || isLoading) && styles.btnDisabled]}
          onPress={handleSaveAndNext}
          disabled={isSaving || isLoading}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.nextBtnText}>Save & Continue</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2 — Documents
  // ══════════════════════════════════════════════════════════════════════════
  const renderStep2 = () => (
    <>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.stepHeader}>
          <View style={styles.stepIconBadge}>
            <Ionicons name="folder-open-outline" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.stepTitle}>Upload Your Documents</Text>
          <Text style={styles.stepSubtitle}>
            Add your ID documents so we can find the right government schemes for you.
            You can also do this later from your Profile.
          </Text>
        </View>

        {/* Upload options */}
        <View style={styles.optionCard}>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => { setPendingAction('gallery'); setTypeModalVisible(true); }}
            activeOpacity={0.8}
          >
            <Ionicons name="images-outline" size={22} color={COLORS.white} />
            <Text style={styles.uploadBtnText}>Upload from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => { setPendingAction('camera'); setTypeModalVisible(true); }}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-outline" size={22} color={COLORS.white} />
            <Text style={styles.uploadBtnText}>Capture using Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.digiLockerBtn}
            onPress={() => Alert.alert('Coming Soon', 'DigiLocker integration will be available soon.')}
            activeOpacity={0.8}
          >
            <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.primary} />
            <Text style={styles.digiLockerBtnText}>Connect with DigiLocker</Text>
          </TouchableOpacity>
        </View>

        {/* Uploaded document list */}
        {documents.length > 0 && (
          <View style={styles.docListSection}>
            <Text style={styles.docListTitle}>Uploaded Documents</Text>
            {documents.map(doc => (
              <View key={doc.id} style={styles.docRow}>
                <Image source={{ uri: doc.uri }} style={styles.docThumb} />
                <View style={styles.docInfo}>
                  <Text style={styles.docName}>{doc.type}</Text>
                  <Text style={styles.docStatus}>✓ Uploaded</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteDoc(doc.id)} style={styles.docDeleteBtn}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {documents.length === 0 && (
          <View style={styles.emptyDocs}>
            <Ionicons name="document-outline" size={40} color={COLORS.border} />
            <Text style={styles.emptyDocsText}>No documents uploaded yet</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={handleFinish}
          activeOpacity={0.8}
        >
          <Text style={styles.nextBtnText}>
            {documents.length > 0 ? 'Finish Setup' : 'Continue to App'}
          </Text>
          <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.white} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
        {documents.length === 0 && (
          <TouchableOpacity onPress={handleFinish} style={styles.skipLink}>
            <Text style={styles.skipLinkText}>I'll add documents later</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Document Type Picker Modal */}
      <Modal visible={typeModalVisible} transparent animationType="slide" onRequestClose={() => setTypeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Document Type</Text>
              <TouchableOpacity onPress={() => setTypeModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>
            {DOCUMENT_TYPES.map(dt => (
              <TouchableOpacity
                key={dt.label}
                style={styles.docTypeOption}
                onPress={() => handleSelectType(dt.label)}
              >
                <View style={styles.docTypeIconCircle}>
                  <Ionicons name={dt.icon as any} size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.docTypeLabel}>{dt.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Ionicons name="shield-checkmark" size={18} color={COLORS.white} />
          </View>
          <Text style={styles.brandName}>Sugam Seva</Text>
        </View>
        <Text style={styles.headerStep}>Step {step} of 2</Text>
      </View>

      {/* Step indicator */}
      <View style={styles.stepIndicatorContainer}>
        <StepIndicator />
        <Text style={styles.stepLabel}>
          {step === 1 ? 'Personal Details' : 'Your Documents'}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.body}>
        {step === 1 ? renderStep1() : renderStep2()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerStep: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  // ── Step indicator ─────────────────────────────────────────────────────────
  stepIndicatorContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  stepDotDone: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  stepDotTextActive: {
    color: COLORS.primary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  stepLineDone: {
    backgroundColor: COLORS.primary,
  },
  stepLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  body: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollArea: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 16,
  },

  // ── Step header ────────────────────────────────────────────────────────────
  stepHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  stepIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },

  // ── Form ───────────────────────────────────────────────────────────────────
  inputGroup: { marginBottom: 16 },
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
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapperDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: COLORS.border,
  },
  inputIcon: { marginRight: 8 },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: COLORS.textDark,
  },
  helperText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  nextBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnDisabled: { opacity: 0.7 },
  skipLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipLinkText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // ── Step 2 — Document upload ───────────────────────────────────────────────
  optionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  uploadBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  digiLockerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
    padding: 14,
    borderRadius: 12,
  },
  digiLockerBtnText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // Document list
  docListSection: { marginTop: 4 },
  docListTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  docThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  docInfo: { flex: 1, marginLeft: 12 },
  docName: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  docStatus: { fontSize: 12, color: COLORS.success, marginTop: 2 },
  docDeleteBtn: { padding: 8 },

  emptyDocs: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  emptyDocsText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 10,
  },

  // ── Document type picker modal ─────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  docTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  docTypeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  docTypeLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textDark,
    fontWeight: '500',
  },
});

export default OnboardingScreen;
