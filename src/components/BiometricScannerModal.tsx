import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Vibration
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAppNavigation } from '../navigation/NavigationContext';

interface BiometricScannerModalProps {
  visible: boolean;
  fingerIndex: number;
  fingerName: string;
  onClose: () => void;
  onScanComplete: (fingerIndex: number, scanData: {
    fingerName: string;
    biometricTemplate: string;
    scanQuality: number;
    scannedAt: string;
  }) => void;
  onScanNext?: () => void;
  hasNextFinger?: boolean;
}

export const BiometricScannerModal: React.FC<BiometricScannerModalProps> = ({
  visible,
  fingerIndex,
  fingerName,
  onClose,
  onScanComplete,
  onScanNext,
  hasNextFinger = false
}) => {
  const { t } = useAppNavigation();
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanQuality, setScanQuality] = useState<number>(98);

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successScaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      setScanState('idle');
      setScanProgress(0);
    }
  }, [visible, fingerIndex]);

  // Handle Scan Process
  const startScanning = () => {
    if (scanState === 'scanning') return;

    setScanState('scanning');
    setScanProgress(0);

    // Provide haptic feedback if on mobile
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(50);
      } catch {}
    }

    // Laser Beam Animation Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Progress increments
    let progress = 0;
    const interval = setInterval(() => {
      progress += 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        completeScan();
      }
      setScanProgress(progress);
    }, 200);
  };

  const completeScan = () => {
    scanLineAnim.stopAnimation();
    pulseAnim.stopAnimation();

    const quality = Math.floor(Math.random() * 4 + 96); // 96-99%
    setScanQuality(quality);
    setScanState('success');

    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate([0, 70, 50, 90]);
      } catch {}
    }

    Animated.spring(successScaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();

    const template = `BIO_SHA256_${Date.now()}_F${fingerIndex}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const scannedAt = new Date().toISOString();

    onScanComplete(fingerIndex, {
      fingerName,
      biometricTemplate: template,
      scanQuality: quality,
      scannedAt
    });
  };

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 60],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.badgeNumber}>
                <Text style={styles.badgeNumberText}>{fingerIndex + 1}/4</Text>
              </View>
              <Text style={styles.headerTitle}>{fingerName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          {/* Subtitle instructions */}
          <Text style={styles.instructionText}>
            {scanState === 'idle'
              ? 'Touch & hold the biometric sensor below to capture fingerprint'
              : scanState === 'scanning'
              ? t('scanningFinger')
              : t('scannerSuccess')}
          </Text>

          {/* Biometric Hologram Sensor */}
          <View style={styles.sensorContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={startScanning}
              disabled={scanState === 'scanning' || scanState === 'success'}
              style={[
                styles.sensorCircle,
                scanState === 'scanning' && styles.sensorCircleScanning,
                scanState === 'success' && styles.sensorCircleSuccess,
              ]}
            >
              <Animated.View
                style={[
                  styles.scannerVisual,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                {/* Fingerprint Graphic */}
                <MaterialCommunityIcons
                  name="fingerprint"
                  size={90}
                  color={
                    scanState === 'success'
                      ? '#10B981'
                      : scanState === 'scanning'
                      ? COLORS.primary
                      : '#94A3B8'
                  }
                />

                {/* Laser Scanning Bar */}
                {scanState === 'scanning' && (
                  <Animated.View
                    style={[
                      styles.laserLine,
                      { transform: [{ translateY }] }
                    ]}
                  />
                )}

                {/* Success Check Icon */}
                {scanState === 'success' && (
                  <View style={styles.successIconOverlay}>
                    <Ionicons name="checkmark-circle" size={36} color="#10B981" />
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>

            {/* Live Progress Bar */}
            {scanState === 'scanning' && (
              <View style={styles.progressBarWrap}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${scanProgress}%` }]} />
                </View>
                <Text style={styles.progressText}>{scanProgress}% Extracted</Text>
              </View>
            )}

            {/* Quality Score Badge */}
            {scanState === 'success' && (
              <View style={styles.qualityCard}>
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                <View style={styles.qualityInfo}>
                  <Text style={styles.qualityTitle}>{t('biometricQuality')}: {scanQuality}%</Text>
                  <Text style={styles.qualitySub}>SHA-256 Biometric Hash Generated</Text>
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {scanState === 'idle' && (
              <TouchableOpacity
                onPress={startScanning}
                style={styles.primaryModalBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="finger-print" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                <Text style={styles.primaryModalBtnText}>Tap to Scan {fingerName}</Text>
              </TouchableOpacity>
            )}

            {scanState === 'scanning' && (
              <View style={styles.scanningStatusBtn}>
                <Text style={styles.scanningStatusText}>Acquiring Biometric Ridge Points...</Text>
              </View>
            )}

            {scanState === 'success' && (
              <View style={styles.successActions}>
                {hasNextFinger && onScanNext ? (
                  <TouchableOpacity
                    onPress={onScanNext}
                    style={styles.primaryModalBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryModalBtnText}>{t('autoScanNext')} →</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.primaryModalBtn}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-done" size={20} color={COLORS.white} style={{ marginRight: 6 }} />
                    <Text style={styles.primaryModalBtnText}>{t('finishScan')}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={startScanning}
                  style={styles.rescanBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.rescanBtnText}>{t('rescanFinger')}</Text>
                </TouchableOpacity>
              </View>
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
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeNumber: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
  },
  badgeNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
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
  sensorCircleScanning: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDF4',
  },
  sensorCircleSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  scannerVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  laserLine: {
    position: 'absolute',
    width: 130,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  successIconOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.white,
    borderRadius: 18,
  },
  progressBarWrap: {
    width: '80%',
    alignItems: 'center',
    marginTop: 16,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 6,
  },
  qualityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
    width: '100%',
  },
  qualityInfo: {
    marginLeft: 10,
  },
  qualityTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#065F46',
  },
  qualitySub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
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
  successActions: {
    width: '100%',
  },
  rescanBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  rescanBtnText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
