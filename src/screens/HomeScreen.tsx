import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAppNavigation } from '../navigation/NavigationContext';
import { mockSchemes } from '../data/mockData';
import { SchemeCard } from '../components/SchemeCard';

export const HomeScreen = () => {
  const { t, setVoiceAssistantVisible, pushScreen, setTab } = useAppNavigation();

  // Find PM-KISAN to display as recommended
  const recommendedScheme = mockSchemes.find((s) => s.id === 'pm-kisan') || mockSchemes[0];

  const stats = [
    {
      icon: 'sparkles',
      label: t('eligibleSchemes'),
      value: '5',
      color: COLORS.primary,
    },
    {
      icon: 'trophy',
      label: t('benefitsScore'),
      value: '78',
      color: '#0891B2',
    },
    {
      icon: 'document-text',
      label: t('inProgress'),
      value: '1',
      color: COLORS.warning,
    },
    {
      icon: 'language',
      label: t('languagesCount'),
      value: '10+',
      color: '#8B5CF6',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Greetings */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>{t('greeting')}</Text>
        <Text style={styles.subGreetingText}>{t('subGreeting')}</Text>
      </View>

      {/* Main AI Card */}
      <TouchableOpacity
        onPress={() => setVoiceAssistantVisible(true)}
        style={styles.aiCard}
        activeOpacity={0.9}
      >
        <View style={styles.aiCardLeft}>
          <Text style={styles.aiCardTitle}>{t('aiCardTitle')}</Text>
          <Text style={styles.aiCardSub}>{t('aiCardSub')}</Text>
        </View>
        <View style={styles.micCircle}>
          <Ionicons name="mic" size={24} color={COLORS.primary} />
        </View>
      </TouchableOpacity>

      {/* Dashboard Quick Stats */}
      <View style={styles.statsGrid}>
        {stats.map((stat, i) => (
          <View key={i} style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: stat.color + '15' }]}>
              <Ionicons name={stat.icon as any} size={20} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel} numberOfLines={2}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Recommendations Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('recommended')}</Text>
        <TouchableOpacity onPress={() => setTab('Schemes')}>
          <Text style={styles.viewAllText}>{t('viewAll')}</Text>
        </TouchableOpacity>
      </View>

      <SchemeCard
        scheme={recommendedScheme}
        onPressDetails={() => pushScreen('Details', { schemeId: recommendedScheme.id })}
      />
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
  greetingContainer: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  subGreetingText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  aiCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  aiCardLeft: {
    flex: 1,
    marginRight: 16,
  },
  aiCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    lineHeight: 24,
  },
  aiCardSub: {
    fontSize: 12,
    color: COLORS.primaryLight,
    marginTop: 6,
    fontWeight: '600',
  },
  micCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});
export default HomeScreen;
