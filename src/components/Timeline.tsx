import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface TimelineStep {
  title: string;
  status: 'Completed' | 'In Progress' | 'Pending';
  date?: string;
}

interface TimelineProps {
  steps: TimelineStep[];
}

export const Timeline = ({ steps }: TimelineProps) => {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = step.status === 'Completed';
        const isInProgress = step.status === 'In Progress';
        const isLast = index === steps.length - 1;

        return (
          <View key={index} style={styles.timelineRow}>
            {/* Left timeline line and dot */}
            <View style={styles.indicatorCol}>
              <View style={styles.dotContainer}>
                {isCompleted ? (
                  <View style={styles.dotCompleted}>
                    <Ionicons name="checkmark" size={10} color={COLORS.white} />
                  </View>
                ) : isInProgress ? (
                  <View style={styles.dotInProgress}>
                    <View style={styles.dotInProgressInner} />
                  </View>
                ) : (
                  <View style={styles.dotPending} />
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

            {/* Right content details */}
            <View style={styles.contentCol}>
              <Text
                style={[
                  styles.titleText,
                  isCompleted && styles.titleCompleted,
                  isInProgress && styles.titleInProgress,
                ]}
              >
                {step.title}
              </Text>
              {step.date && (
                <Text style={styles.dateText}>{step.date}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 60,
  },
  indicatorCol: {
    alignItems: 'center',
    marginRight: 16,
    width: 20,
  },
  dotContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dotCompleted: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInProgress: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInProgressInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  dotPending: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
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
    paddingTop: 0,
    paddingBottom: 16,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  titleCompleted: {
    color: COLORS.textDark,
    fontWeight: 'bold',
  },
  titleInProgress: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
export default Timeline;
