import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAppNavigation } from '../navigation/NavigationContext';
import { useData } from '../context/DataContext';
import { PrimaryButton } from '../components/PrimaryButton';

export const SchemeDetailsScreen = () => {
  const { t, currentScreen, pushScreen } = useAppNavigation();
  const { schemes } = useData();

  const schemeId = currentScreen.params?.schemeId || 'pm-kisan';
  const scheme = schemes.find((s) => s.id === schemeId) || schemes[0];

  if (!scheme) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: COLORS.textMuted }}>{t('loadingSchemeDetails')}</Text>
      </View>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this government scheme: ${scheme.name}. Benefits: ${scheme.benefits}. Apply via Sugam Seva app!`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title Header with share */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>{t('schemeDetails')}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareIcon}>
          <Ionicons name="share-social-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Eligibility Badge */}
      {scheme.isEligible && (
        <View style={styles.badgeContainer}>
          <View style={styles.eligibilityBadge}>
            <Ionicons name="sparkles" size={14} color={COLORS.success} />
            <Text style={styles.badgeText}>{t('eligibleBadge')}</Text>
          </View>
        </View>
      )}

      {/* Scheme Title & Subtitle */}
      <Text style={styles.schemeName}>{scheme.name}</Text>
      <Text style={styles.schemeDesc}>{scheme.description}</Text>

      {/* Benefits Card */}
      <View style={styles.benefitsCard}>
        <Text style={styles.benefitsLabel}>{t('totalBenefits')}</Text>
        <Text style={styles.benefitsValue}>{scheme.benefits}</Text>
        {scheme.benefitsDetail && (
          <Text style={styles.benefitsDetail}>{scheme.benefitsDetail}</Text>
        )}
      </View>

      {/* Section: Why you may be eligible */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>{t('whyEligible')}</Text>
        {scheme.eligibilityCriteria.map((criterion, idx) => (
          <View key={idx} style={styles.bulletRow}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={12} color={COLORS.success} />
            </View>
            <Text style={styles.bulletText}>{criterion}</Text>
          </View>
        ))}
      </View>

      {/* Section: What you'll need */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>{t('whatNeeded')}</Text>
        <Text style={styles.sectionSub}>{t('requiredDocsLabel')}</Text>
        <View style={styles.docChipRow}>
          {scheme.requiredDocuments.map((doc, idx) => (
            <View key={idx} style={styles.docChip}>
              <Ionicons name="document-text" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.docChipText}>{doc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA Button */}
      <PrimaryButton
        title={t('applyWithDoc')}
        onPress={() => pushScreen('Application', { schemeId: scheme.id })}
        style={styles.ctaButton}
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  shareIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  eligibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.success,
    marginLeft: 6,
  },
  schemeName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  schemeDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  benefitsCard: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  benefitsLabel: {
    fontSize: 11,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: 'bold',
  },
  benefitsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 4,
  },
  benefitsDetail: {
    fontSize: 13,
    color: COLORS.textDark,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  sectionSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bulletText: {
    fontSize: 14,
    color: COLORS.textDark,
  },
  docChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  docChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  docChipText: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  ctaButton: {
    marginTop: 12,
  },
});
export default SchemeDetailsScreen;