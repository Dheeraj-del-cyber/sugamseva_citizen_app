import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { Scheme } from '../types';
import { useAppNavigation } from '../navigation/NavigationContext';

interface SchemeCardProps {
  scheme: Scheme;
  onPressDetails?: () => void;
}

export const SchemeCard = ({ scheme, onPressDetails }: SchemeCardProps) => {
  const { t, pushScreen } = useAppNavigation();

  const handlePress = () => {
    if (onPressDetails) {
      onPressDetails();
    } else {
      pushScreen('Details', { schemeId: scheme.id });
    }
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.badgeContainer}>
          <Text style={styles.stateBadge}>{scheme.state}</Text>
          <Text style={styles.categoryBadge}>{scheme.category}</Text>
        </View>
        {scheme.isEligible && (
          <View style={styles.eligibleBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Text style={styles.eligibleText}>{t('eligibleBadge')}</Text>
          </View>
        )}
      </View>

      <Text style={styles.titleText}>{scheme.name}</Text>
      <Text style={styles.descText} numberOfLines={2}>
        {scheme.description}
      </Text>

      <View style={styles.footerRow}>
        <View style={styles.benefitContainer}>
          <Text style={styles.benefitLabel}>{t('benefitsColon')}</Text>
          <Text style={styles.benefitValue}>{scheme.benefits}</Text>
        </View>
        <TouchableOpacity
          onPress={handlePress}
          style={styles.detailsButton}
          activeOpacity={0.7}
        >
          <Text style={styles.detailsText}>{t('viewDetails')}</Text>
          <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stateBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  categoryBadge: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  eligibleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  eligibleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.success,
    marginLeft: 4,
  },
  titleText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  descText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 14,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  benefitContainer: {
    flexDirection: 'column',
  },
  benefitLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  benefitValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 2,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailsText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 4,
  },
});
export default SchemeCard;