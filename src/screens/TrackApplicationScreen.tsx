import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAppNavigation } from '../navigation/NavigationContext';
import { useData } from '../context/DataContext';
import { Timeline } from '../components/Timeline';

export const TrackApplicationScreen = () => {
  const { t, setVoiceAssistantVisible } = useAppNavigation();
  const { applications, isLoadingApplications } = useData();

  // Most recently submitted real application for this citizen
  const app = applications[0];

  if (isLoadingApplications) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!app) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>No applications yet</Text>
        <Text style={styles.emptySub}>Apply to a scheme from the Discover tab to start tracking it here.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>{t('trackApp')}</Text>
      </View>

      {/* Application Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.cardHeader}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.schemeName}>{app.schemeName}</Text>
            <Text style={styles.appId}>ID: {app.id}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{app.status}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.footerLabel}>{t('submittedOn')}:</Text>
          <Text style={styles.footerValue}>{app.submittedDate}</Text>
        </View>
      </View>

      {/* Timeline Section */}
      <View style={styles.timelineCard}>
        <Timeline steps={app.steps} />
      </View>

      {/* Help Card at bottom */}
      <View style={styles.helpCard}>
        <View style={styles.helpCardLeft}>
          <View style={styles.helpIconCircle}>
            <Ionicons name="chatbubble-ellipses" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.helpCardText}>
            <Text style={styles.helpTitle}>{t('needHelp')}</Text>
            <Text style={styles.helpSub}>{t('talkAssistant')}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setVoiceAssistantVisible(true)}
          style={styles.talkButton}
          activeOpacity={0.7}
        >
          <Text style={styles.talkButtonText}>{t('talkNow')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerBar: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  schemeName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  appId: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#FEF3C7', // soft warning bg
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.warning,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  footerLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginRight: 6,
  },
  footerValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  timelineCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  helpCard: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helpCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  helpIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  helpCardText: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  helpSub: {
    fontSize: 12,
    color: COLORS.textDark,
    marginTop: 2,
  },
  talkButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  talkButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});
export default TrackApplicationScreen;