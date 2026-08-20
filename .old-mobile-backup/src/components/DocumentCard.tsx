import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { CitizenDocument } from '../types';
import { useAppNavigation } from '../navigation/NavigationContext';

interface DocumentCardProps {
  document: CitizenDocument;
}

export const DocumentCard = ({ document }: DocumentCardProps) => {
  const { t } = useAppNavigation();
  const isVerified = document.status === 'Verified';

  return (
    <View style={styles.cardContainer}>
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={
              document.name.includes('Aadhaar')
                ? 'card'
                : document.name.includes('Bank')
                ? 'business'
                : 'document-text'
            }
            size={24}
            color={COLORS.primary}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.docName}>{document.name}</Text>
          <View style={styles.sourceRow}>
            <Text style={styles.docNumber}>{document.docNumber || '---'}</Text>
            <View style={styles.divider} />
            <Text style={styles.docSource}>{document.source}</Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.statusBadge,
          isVerified ? styles.statusBadgeVerified : styles.statusBadgePending,
        ]}
      >
        <Ionicons
          name={isVerified ? 'checkmark-circle' : 'time'}
          size={16}
          color={isVerified ? COLORS.success : COLORS.warning}
          style={styles.statusIcon}
        />
        <Text style={[styles.statusText, isVerified ? styles.statusTextVerified : styles.statusTextPending]}>
          {isVerified ? t('verified') : t('pending')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  docName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  docNumber: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  divider: {
    width: 1,
    height: 10,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  docSource: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeVerified: {
    backgroundColor: '#DCFCE7', // soft success bg
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7', // soft warning bg
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextVerified: {
    color: COLORS.success,
  },
  statusTextPending: {
    color: COLORS.warning,
  },
});
export default DocumentCard;
