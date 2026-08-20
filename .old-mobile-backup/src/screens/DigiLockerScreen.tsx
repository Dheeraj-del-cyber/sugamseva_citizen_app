import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAppNavigation } from '../navigation/NavigationContext';
import { useData } from '../context/DataContext';
import { DocumentCard } from '../components/DocumentCard';

export const DigiLockerScreen = () => {
  const { t, popScreen } = useAppNavigation();
  const { documents, isLoadingDocuments } = useData();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={popScreen} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('myDocuments')}</Text>
      </View>

      <View style={styles.digiLockerHeader}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="lock-closed" size={20} color={COLORS.white} />
          </View>
          <Text style={styles.logoText}>{t('digiLockerRecords')}</Text>
        </View>
        <Text style={styles.headerDesc}>
          {t('digiLockerDesc')}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>{t('documentsOnFile')}</Text>

      {isLoadingDocuments ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : documents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="folder-open-outline" size={40} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>{t('noDocumentsYet')}</Text>
        </View>
      ) : (
        documents.map((doc) => (
          <DocumentCard key={doc.id} document={doc} />
        ))
      )}
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
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  digiLockerHeader: {
    backgroundColor: '#EFF6FF', // soft blue bg
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 16,
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2563EB', // Blue 600
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  headerDesc: {
    fontSize: 13,
    color: '#1E3A8A',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 10,
  },
});
export default DigiLockerScreen;