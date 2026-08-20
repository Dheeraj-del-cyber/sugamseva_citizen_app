import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAppNavigation } from '../navigation/NavigationContext';

export interface SavedDocument {
  id: string;
  type: string;
  uri: string;
}

const DOCUMENT_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Driving Licence',
  'Passport',
  'Voter ID',
  'Other Document'
];

export const DocumentsScreen = () => {
  const { popScreen, pushScreen, currentScreen } = useAppNavigation();
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [typeModalVisible, setTypeModalVisible] = useState(false);

  // Check if we returned from capture with a new document
  useEffect(() => {
    if (currentScreen.params?.newDocument) {
      const newDoc = currentScreen.params.newDocument;
      setDocuments(prev => {
        // If it's a replacement, replace it
        if (currentScreen.params?.replaceId) {
          return prev.map(d => d.id === currentScreen.params.replaceId ? newDoc : d);
        }
        return [...prev, newDoc];
      });
      // Clean params so it doesn't add again on re-render
      currentScreen.params.newDocument = null;
      currentScreen.params.replaceId = null;
    }
  }, [currentScreen.params]);

  const handleDigiLocker = () => {
    Alert.alert('Coming Soon', 'DigiLocker integration will be available soon.');
  };

  const handleSelectType = (type: string) => {
    setTypeModalVisible(false);
    pushScreen('DocumentCapture', { documentType: type });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Document', 'Are you sure you want to delete this document?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: () => {
          setDocuments(prev => prev.filter(d => d.id !== id));
        }
      }
    ]);
  };

  const handleReplace = (doc: SavedDocument) => {
    pushScreen('DocumentCapture', { documentType: doc.type, replaceId: doc.id });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={popScreen} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Documents</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Upload Your Documents</Text>
          <Text style={styles.sectionSub}>Please upload the required documents to continue.</Text>

          <TouchableOpacity 
            style={styles.primaryOptionBtn} 
            onPress={() => setTypeModalVisible(true)}
          >
            <Ionicons name="cloud-upload-outline" size={24} color={COLORS.white} />
            <Text style={styles.primaryOptionText}>Upload Documents</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryOptionBtn} 
            onPress={handleDigiLocker}
          >
            <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.primary} />
            <Text style={styles.secondaryOptionText}>Connect with DigiLocker</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Uploaded Documents</Text>
          
          {documents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyStateText}>No documents uploaded yet.</Text>
            </View>
          ) : (
            documents.map(doc => (
              <View key={doc.id} style={styles.docCard}>
                <Image source={{ uri: doc.uri }} style={styles.docPreview} />
                <View style={styles.docInfo}>
                  <Text style={styles.docType}>{doc.type}</Text>
                  <Text style={styles.docStatus}>Uploaded successfully</Text>
                </View>
                <View style={styles.docActions}>
                  <TouchableOpacity onPress={() => handleReplace(doc)} style={styles.actionBtn}>
                    <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(doc.id)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Document Type Selection Modal */}
      <Modal visible={typeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Document Type</Text>
              <TouchableOpacity onPress={() => setTypeModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {DOCUMENT_TYPES.map(type => (
                <TouchableOpacity 
                  key={type} 
                  style={styles.typeOption}
                  onPress={() => handleSelectType(type)}
                >
                  <Text style={styles.typeOptionText}>{type}</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.border} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  content: { flex: 1, padding: 16 },
  optionsContainer: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 4 },
  sectionSub: { fontSize: 13, color: COLORS.textMuted, marginBottom: 16 },
  primaryOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryOptionText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  secondaryOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 14,
    borderRadius: 12,
  },
  secondaryOptionText: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  listContainer: { flex: 1 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginTop: 12,
  },
  emptyStateText: { color: COLORS.textMuted, marginTop: 12, fontSize: 14 },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  docPreview: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#F1F5F9' },
  docInfo: { flex: 1, marginLeft: 12 },
  docType: { fontSize: 15, fontWeight: 'bold', color: COLORS.textDark },
  docStatus: { fontSize: 12, color: COLORS.success, marginTop: 4 },
  docActions: { flexDirection: 'row' },
  actionBtn: { padding: 8, marginLeft: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  typeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  typeOptionText: { fontSize: 16, color: COLORS.textDark },
});

export default DocumentsScreen;
