import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { runOsBiometricPrompt, checkBiometricHardware } from '../services/biometrics';
import { useAppNavigation } from '../navigation/NavigationContext';

interface BiometricScannerModalProps {
  visible: boolean;
  /** What this scan is for - shown to the person and passed to the OS prompt. */
  purpose: 'enroll' | 'signin';
  promptMessage: string;
  onClose: () => void;
  onResult: (result: { success: boolean; error?: string }) => void;
}

/**
 * This modal does NOT scan or store a fingerprint itself - no app can. It calls the
 * phone's own operating system fingerprint/Face ID prompt (LocalAuthentication) and
 * simply reflects back whether that real, live OS-level check succeeded.
 */
export const BiometricScannerModal: React.FC<BiometricScannerModalProps> = ({
  visible,
  purpose,
  promptMessage,
  onClose,
  onResult,
}) => {
  const { t } = useAppNavigation();
  const [state, setState] = useState<'idle' | 'checking' | 'waiting_os' | 'success' | 'error'>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setState('idle');
      setErrorText(null);
    }
  }, [visible]);

  useEffect(() => {
    if (state === 'waiting_os') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, easing: Easing.ease, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, easing: Easing.ease, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [state]);

  const start = async () => {
    setState('checking');
    setErrorText(null);

    const hw = await checkBiometricHardware();
    if (!hw.available) {
      setState('error');
      setErrorText(hw.reason || t('fingerprintNotAvailable'));
      return;
    }

    setState('waiting_os');
    const result = await runOsBiometricPrompt(promptMessage);

    if (result.success) {
      setState('success');
      onResult({ success: true });
    } else {
      setState('error');
      setErrorText(result.error || t('fingerprintDidNotMatch'));
      onResult({ success: false, error: result.error });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>
              {purpose === 'enroll' ? t('enableFingerprintSignIn') : t('fingerprintSignInTitle')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <Text style={styles.instructionText}>
            {state === 'idle' && t('biometricIdleInstruction')}
            {state === 'checking' && t('checkingDevice')}
            {state === 'waiting_os' && t('followDevicePrompt')}
            {state === 'success' && t('verifiedByDevice')}
            {state === 'error' && (errorText || t('somethingWentWrong'))}
          </Text>

          <View style={styles.sensorContainer}>
            <Animated.View style={[styles.sensorCircle, state === 'error' && styles.sensorCircleError, state === 'success' && styles.sensorCircleSuccess, { transform: [{ scale: pulseAnim }] }]}>
              <MaterialCommunityIcons
                name="fingerprint"
                size={90}
                color={state === 'success' ? '#10B981' : state === 'error' ? '#DC2626' : state === 'waiting_os' ? COLORS.primary : '#94A3B8'}
              />
              {state === 'success' && (
                <View style={styles.successIconOverlay}>
                  <Ionicons name="checkmark-circle" size={36} color="#10B981" />
                </View>
              )}
            </Animated.View>
          </View>

          <View style={styles.actionsRow}>
            {(state === 'idle' || state === 'error') && (
              <TouchableOpacity onPress={start} style={styles.primaryModalBtn} activeOpacity={0.8}>
                <Ionicons name="finger-print" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                <Text style={styles.primaryModalBtnText}>
                  {state === 'error' ? t('tryAgain') : t('useDeviceFingerprint')}
                </Text>
              </TouchableOpacity>
            )}
            {(state === 'checking' || state === 'waiting_os') && (
              <View style={styles.scanningStatusBtn}>
                <Text style={styles.scanningStatusText}>{t('waitingForDevice')}</Text>
              </View>
            )}
            {state === 'success' && (
              <TouchableOpacity onPress={onClose} style={styles.primaryModalBtn} activeOpacity={0.8}>
                <Ionicons name="checkmark-done" size={20} color={COLORS.white} style={{ marginRight: 6 }} />
                <Text style={styles.primaryModalBtnText}>{t('done')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  instructionText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  sensorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: '100%',
  },
  sensorCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  sensorCircleError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  sensorCircleSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  successIconOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.white,
    borderRadius: 18,
  },
  actionsRow: {
    width: '100%',
    marginTop: 20,
  },
  primaryModalBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  primaryModalBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  scanningStatusBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  scanningStatusText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});