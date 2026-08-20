import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAppNavigation } from '../navigation/NavigationContext';
import { ProgressStepper } from '../components/ProgressStepper';
import { PrimaryButton } from '../components/PrimaryButton';
import { useData } from '../context/DataContext';

export const ApplicationScreen = () => {
  const { t, pushScreen, popScreen, setTab, currentScreen } = useAppNavigation();
  const { schemes, submitApplication } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schemeId = currentScreen.params?.schemeId || 'pm-kisan';
  const scheme = schemes.find((s) => s.id === schemeId) || schemes[0];

  const steps = [
    { title: 'Personal Details', status: 'Completed' as const },
    { title: 'Documents', status: 'Completed' as const },
    { title: 'Eligibility Check', status: 'Completed' as const },
    { title: 'Review & Submit', status: 'In Progress' as const },
  ];

  const handleReview = async () => {
    if (!scheme) return;
    setIsSubmitting(true);
    const result = await submitApplication(scheme.id, scheme.name);
    setIsSubmitting(false);

    if (result) {
      Alert.alert(
        "Application Submitted",
        `Your application (${result.id}) has been submitted and is under review.`,
        [{ text: "Track Application", onPress: () => setTab('Track') }]
      );
    } else {
      Alert.alert("Submission Failed", "We couldn't submit your application. Please check your connection and try again.");
    }
  };

  const handleExit = () => {
    setTab('Home');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title Header with help icon */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>{t('application')}</Text>
        <TouchableOpacity style={styles.helpIcon} accessibilityLabel="Help">
          <Ionicons name="help-circle-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Scheme Title & App ID */}
      <View style={styles.schemeTitleBlock}>
        <Text style={styles.schemeName}>{scheme.name}</Text>
        <View style={styles.appIdRow}>
          <Text style={styles.appIdLabel}>{t('appId')}:</Text>
          <Text style={styles.appIdValue}>PMKISAN2024XXXX</Text>
        </View>
      </View>

      {/* Stepper tracker */}
      <View style={styles.stepperContainer}>
        <ProgressStepper steps={steps} currentStepIndex={3} />
      </View>

      {/* Confirmation Box */}
      <View style={styles.infoCard}>
        <View style={styles.shieldIconCircle}>
          <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
        </View>
        <View style={styles.infoCardContent}>
          <Text style={styles.infoCardTitle}>{t('preparedTitle')}</Text>
          <Text style={styles.infoCardDesc}>{t('preparedDesc')}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <PrimaryButton
          title={isSubmitting ? 'Submitting...' : t('reviewApp')}
          onPress={handleReview}
          disabled={isSubmitting}
          style={styles.primaryBtn}
        />
        <PrimaryButton
          title={t('saveExit')}
          onPress={handleExit}
          variant="secondary"
        />
      </View>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  helpIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
  },
  schemeTitleBlock: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  schemeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  appIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  appIdLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginRight: 6,
  },
  appIdValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  stepperContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  shieldIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  infoCardDesc: {
    fontSize: 13,
    color: COLORS.textDark,
    marginTop: 4,
    lineHeight: 18,
  },
  buttonContainer: {
    width: '100%',
  },
  primaryBtn: {
    marginBottom: 12,
  },
});
export default ApplicationScreen;