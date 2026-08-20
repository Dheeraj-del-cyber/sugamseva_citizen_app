import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAppNavigation } from '../navigation/NavigationContext';

export const DocumentCaptureScreen = () => {
  const { popScreen, currentScreen } = useAppNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const documentType = currentScreen.params?.documentType || 'Document';
  const replaceId = currentScreen.params?.replaceId;

  if (!permission) {
    // Camera permissions are still loading.
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-outline" size={64} color={COLORS.border} />
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={popScreen}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsProcessing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        if (photo?.uri) {
          setCapturedImage(photo.uri);
        }
      } catch (e) {
        Alert.alert('Error', 'Failed to capture image. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const saveDocument = () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    
    // Simulate secure saving/processing delay
    setTimeout(() => {
      setIsProcessing(false);
      // Pass the new document info back through navigation params
      currentScreen.params.newDocument = {
        id: Date.now().toString(),
        type: documentType,
        uri: capturedImage,
      };
      if (replaceId) {
        currentScreen.params.replaceId = replaceId;
      }
      popScreen();
    }, 800);
  };

  if (capturedImage) {
    // Preview Mode
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCapturedImage(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Preview</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} resizeMode="contain" />
        </View>
        <View style={styles.previewActions}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.retakeBtn]} 
            onPress={() => setCapturedImage(null)}
            disabled={isProcessing}
          >
            <Ionicons name="refresh" size={20} color={COLORS.textDark} />
            <Text style={styles.retakeBtnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.saveBtn]} 
            onPress={saveDocument}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color={COLORS.white} />
                <Text style={styles.saveBtnText}>Save Document</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Camera Mode
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={popScreen} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Capture {documentType}</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <CameraView style={styles.camera} facing={cameraType} ref={cameraRef}>
        <View style={styles.cameraOverlay}>
          {/* Document Framing Guide */}
          <View style={styles.frameGuide}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.instructionText}>
            Place the document inside the frame
          </Text>
        </View>
      </CameraView>
      
      <View style={styles.cameraActions}>
        <TouchableOpacity style={styles.captureBtn} onPress={takePicture} disabled={isProcessing}>
          <View style={styles.captureBtnInner}>
            {isProcessing && <ActivityIndicator color={COLORS.primary} size="large" />}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: COLORS.white },
  permissionText: { textAlign: 'center', marginVertical: 20, fontSize: 16, color: COLORS.textDark },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { padding: 12 },
  cancelBtnText: { color: COLORS.textMuted, fontSize: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
    backgroundColor: COLORS.white,
    zIndex: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  camera: { flex: 1 },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameGuide: {
    width: '85%',
    height: '60%',
    borderWidth: 0,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.white,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  instructionText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cameraActions: {
    backgroundColor: COLORS.black,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewActions: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  retakeBtn: {
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  retakeBtnText: {
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default DocumentCaptureScreen;
