import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAppNavigation } from '../navigation/NavigationContext';
import { mockDocuments } from '../data/mockData';
import { DocumentCard } from '../components/DocumentCard';

export const DigiLockerScreen = () => {
  const { t, popScreen } = useAppNavigation();

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
          <Text style={styles.logoText}>DigiLocker</Text>
        </View>
        <Text style={styles.headerDesc}>
          Your documents are securely fetched and synced with the national DigiLocker repository.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Synced Documents</Text>

      {mockDocuments.map((doc) => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
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
});
export default DigiLockerScreen;
