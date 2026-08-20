import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAppNavigation } from '../navigation/NavigationContext';

export const VoiceAssistantModal = () => {
  const { voiceAssistantVisible, setVoiceAssistantVisible, t, pushScreen, setSelectedCategory } = useAppNavigation();
  const [inputText, setInputText] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [responseIntent, setResponseIntent] = useState<'eligible' | 'agriculture' | 'financial' | 'generic' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micActive, setMicActive] = useState(true);

  // Pulse effect simulation
  const [pulseCount, setPulseCount] = useState(1);

  useEffect(() => {
    let interval: any;
    if (micActive && voiceAssistantVisible) {
      interval = setInterval(() => {
        setPulseCount((prev) => (prev === 3 ? 1 : prev + 1));
      }, 800);
    }
    return () => clearInterval(interval);
  }, [micActive, voiceAssistantVisible]);

  // Suggestion chips carry a language-independent intent id alongside their
  // (translated) display text, so tapping one always resolves to the right
  // canned response no matter which of the 13 languages is active.
  const handleSuggestQuery = (query: string, intent: 'eligible' | 'agriculture' | 'financial') => {
    setInputText(query);
    processQuery(query, intent);
  };

  const handleSubmitText = () => {
    if (!inputText.trim()) return;
    processQuery(inputText);
  };

  const processQuery = (queryText: string, intent?: 'eligible' | 'agriculture' | 'financial') => {
    setMicActive(false);
    setIsProcessing(true);
    setAiResponse(null);
    setResponseIntent(null);

    // Mock processing response delay
    setTimeout(() => {
      setIsProcessing(false);
      // Free-typed queries are matched against English keywords, which only
      // works reliably when the person types in English - for anything that
      // doesn't match (including non-English free text) we fall back to the
      // generic response, which echoes their own query back to them.
      const query = queryText.toLowerCase();
      const resolvedIntent: 'eligible' | 'agriculture' | 'financial' | 'generic' =
        intent ||
        (query.includes('eligible') || query.includes('what schemes')
          ? 'eligible'
          : query.includes('agriculture') || query.includes('farmer')
          ? 'agriculture'
          : query.includes('financial') || query.includes('money') || query.includes('assistance')
          ? 'financial'
          : 'generic');

      setResponseIntent(resolvedIntent);
      if (resolvedIntent === 'eligible') {
        setAiResponse(t('aiEligibleResponse'));
      } else if (resolvedIntent === 'agriculture') {
        setAiResponse(t('aiAgricultureResponse'));
      } else if (resolvedIntent === 'financial') {
        setAiResponse(t('aiFinancialResponse'));
      } else {
        setAiResponse(t('aiGenericResponse', { query: queryText }));
      }
    }, 1500);
  };

  const handleAction = () => {
    // Actions based on response type
    setVoiceAssistantVisible(false);
    setInputText('');
    setAiResponse(null);
    setMicActive(true);

    if (responseIntent === 'eligible' || responseIntent === 'agriculture') {
      pushScreen('Details', { schemeId: 'pm-kisan' });
    } else {
      pushScreen('Discover');
    }
    setResponseIntent(null);
  };

  const handleResetMic = () => {
    setMicActive(true);
    setAiResponse(null);
    setResponseIntent(null);
    setInputText('');
  };

  const suggestions: { id: 'eligible' | 'agriculture' | 'financial'; text: string }[] = [
    { id: 'eligible', text: t('q1') },
    { id: 'financial', text: t('q2') },
    { id: 'agriculture', text: t('q3') }
  ];

  return (
    <Modal
      visible={voiceAssistantVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setVoiceAssistantVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          {/* Close Handle / Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('aiCardSub')}</Text>
            <TouchableOpacity
              onPress={() => {
                setVoiceAssistantVisible(false);
                setAiResponse(null);
                setInputText('');
                setMicActive(true);
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* AI Assistant Output Card */}
            <View style={styles.responseContainer}>
              {micActive && (
                <View style={styles.listeningBlock}>
                  <Text style={styles.statusTitle}>{t('listening')}</Text>
                  <Text style={styles.statusSub}>{t('tellNeed')}</Text>
                </View>
              )}

              {isProcessing && (
                <View style={styles.processingBlock}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.processingText}>{t('analyzingQuery')}</Text>
                </View>
              )}

              {aiResponse && (
                <View style={styles.aiResponseBlock}>
                  <View style={styles.assistantAvatar}>
                    <Ionicons name="sparkles" size={16} color={COLORS.white} />
                  </View>
                  <View style={styles.bubble}>
                    <Text style={styles.responseText}>{aiResponse}</Text>
                    <TouchableOpacity onPress={handleAction} style={styles.bubbleActionBtn}>
                      <Text style={styles.bubbleActionText}>{t('viewRelatedScheme')}</Text>
                      <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Listening Mic Pulse Animation */}
            {micActive && (
              <View style={styles.voiceAnimationContainer}>
                <View style={[styles.pulseRing, pulseCount >= 1 && styles.pulseActive1]} />
                <View style={[styles.pulseRing, pulseCount >= 2 && styles.pulseActive2]} />
                <View style={[styles.pulseRing, pulseCount >= 3 && styles.pulseActive3]} />
                <TouchableOpacity style={styles.micCircleBig} onPress={() => processQuery(t('q1'), 'eligible')}>
                  <Ionicons name="mic" size={40} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            )}

            {!micActive && !isProcessing && (
              <TouchableOpacity onPress={handleResetMic} style={styles.resetMicBtn}>
                <Ionicons name="mic-outline" size={20} color={COLORS.primary} />
                <Text style={styles.resetMicText}>{t('tapToSpeakAgain')}</Text>
              </TouchableOpacity>
            )}

            {/* Example Queries Chips */}
            <View style={styles.suggestionsContainer}>
              <Text style={styles.sectionLabel}>{t('suggestedQueries')}</Text>
              <View style={styles.chipRow}>
                {suggestions.map((query) => (
                  <TouchableOpacity
                    key={query.id}
                    onPress={() => handleSuggestQuery(query.text, query.id)}
                    style={styles.chip}
                  >
                    <Text style={styles.chipText}>{query.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Text Input Fallback Bar */}
          <View style={styles.inputContainer}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={t('typePlaceholder')}
              placeholderTextColor={COLORS.textMuted}
              style={styles.textInput}
              onSubmitEditing={handleSubmitText}
            />
            <TouchableOpacity onPress={handleSubmitText} style={styles.sendButton}>
              <Ionicons name="send" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 81, 50, 0.4)', // Soft green tint overlay
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  closeButton: {
    padding: 4,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  responseContainer: {
    width: '100%',
    minHeight: 120,
    justifyContent: 'center',
    marginBottom: 20,
  },
  listeningBlock: {
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  processingBlock: {
    alignItems: 'center',
  },
  processingText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  aiResponseBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 4,
  },
  bubble: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
    borderRadius: 16,
    padding: 14,
  },
  responseText: {
    fontSize: 14,
    color: COLORS.textDark,
    lineHeight: 20,
  },
  bubbleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
  },
  bubbleActionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 4,
  },
  voiceAnimationContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    width: 80,
    height: 80,
    opacity: 0,
  },
  pulseActive1: {
    width: 100,
    height: 100,
    opacity: 0.6,
  },
  pulseActive2: {
    width: 130,
    height: 130,
    opacity: 0.4,
  },
  pulseActive3: {
    width: 160,
    height: 160,
    opacity: 0.2,
  },
  micCircleBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  resetMicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
    marginBottom: 20,
  },
  resetMicText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 6,
  },
  suggestionsContainer: {
    width: '100%',
    marginTop: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textDark,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.textDark,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
export default VoiceAssistantModal;