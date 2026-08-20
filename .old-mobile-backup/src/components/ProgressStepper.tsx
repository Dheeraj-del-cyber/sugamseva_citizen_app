import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface Step {
  title: string;
  status: 'Completed' | 'In Progress' | 'Pending';
}

interface ProgressStepperProps {
  steps: Step[];
  currentStepIndex: number;
}

export const ProgressStepper = ({ steps, currentStepIndex }: ProgressStepperProps) => {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = step.status === 'Completed' || index < currentStepIndex;
        const isActive = step.status === 'In Progress' || index === currentStepIndex;
        const isLast = index === steps.length - 1;

        return (
          <View key={index} style={styles.stepRow}>
            {/* Left Line & Icon indicator */}
            <View style={styles.indicatorCol}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isActive && styles.circleActive,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                ) : (
                  <Text
                    style={[
                      styles.circleText,
                      isActive && styles.circleTextActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.line,
                    isCompleted && styles.lineCompleted,
                  ]}
                />
              )}
            </View>

            {/* Right details */}
            <View style={styles.contentCol}>
              <Text
                style={[
                  styles.stepTitle,
                  isActive && styles.stepTitleActive,
                  isCompleted && styles.stepTitleCompleted,
                ]}
              >
                {step.title}
              </Text>
              <Text
                style={[
                  styles.stepStatus,
                  isCompleted && styles.stepStatusCompleted,
                  isActive && styles.stepStatusActive,
                ]}
              >
                {step.status === 'Completed' ? 'Completed' : step.status === 'In Progress' ? 'In Progress' : 'Pending'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 65,
  },
  indicatorCol: {
    alignItems: 'center',
    marginRight: 16,
    width: 30,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  circleCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  circleActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  circleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  circleTextActive: {
    color: COLORS.primary,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  lineCompleted: {
    backgroundColor: COLORS.primary,
  },
  contentCol: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  stepTitleActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  stepTitleCompleted: {
    color: COLORS.textDark,
  },
  stepStatus: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  stepStatusCompleted: {
    color: COLORS.success,
    fontWeight: '500',
  },
  stepStatusActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
export default ProgressStepper;
