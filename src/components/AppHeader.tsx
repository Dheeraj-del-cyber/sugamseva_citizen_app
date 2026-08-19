import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAppNavigation } from '../navigation/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { AppLanguage } from '../types';

export const AppHeader = () => {
  const { t, activeLanguage, setLanguage, popScreen, screenStack, setTab } = useAppNavigation();
  const { user } = useAuth();
  const [langDropdownVisible, setLangDropdownVisible] = useState(false);

  const canGoBack = screenStack.length > 1;

  const languages: { code: AppLanguage; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'kn', label: 'ಕನ್ನಡ (KN)' },
    { code: 'hi', label: 'हिन्दी (HI)' }
  ];

  const defaultAvatar = `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(user?.name || 'Citizen')}&backgroundColor=047857`;

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        {canGoBack ? (
          <TouchableOpacity onPress={popScreen} style={styles.iconButton} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setTab('Home')} style={styles.iconButton} accessibilityLabel="Home">
            <Ionicons name="home-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        <View style={styles.logoAndText}>
          <View style={styles.emblemContainer}>
            <Ionicons name="shield-checkmark" size={18} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.titleText}>{t('appName')}</Text>
            <Text style={styles.subtitleText}>{t('appSubtitle')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.rightSection}>
        {/* Language selector */}
        <TouchableOpacity
          onPress={() => setLangDropdownVisible(true)}
          style={styles.langSelector}
          accessibilityLabel="Change Language"
        >
          <Ionicons name="language" size={15} color={COLORS.primary} />
          <Text style={styles.langText}>
            {activeLanguage === 'en' ? 'EN' : activeLanguage === 'kn' ? 'KN' : 'HI'}
          </Text>
          <Ionicons name="chevron-down" size={12} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Citizen Profile Avatar Shortcut */}
        <TouchableOpacity
          onPress={() => setTab('Profile')}
          style={styles.avatarButton}
          accessibilityLabel="My Profile"
        >
          <Image
            source={{ uri: user?.avatar || defaultAvatar }}
            style={styles.headerAvatar}
          />
        </TouchableOpacity>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={langDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLangDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLangDropdownVisible(false)}
        >
          <View style={styles.dropdownMenu}>
            <Text style={styles.dropdownHeader}>Select Language / ಭಾಷೆ / भाषा</Text>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.dropdownItem,
                  activeLanguage === lang.code && styles.dropdownItemActive
                ]}
                onPress={() => {
                  setLanguage(lang.code);
                  setLangDropdownVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    activeLanguage === lang.code && styles.dropdownItemTextActive
                  ]}
                >
                  {lang.label}
                </Text>
                {activeLanguage === lang.code && (
                  <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 60,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconButton: {
    padding: 6,
    marginRight: 6,
    borderRadius: 20,
  },
  logoAndText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emblemContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  subtitleText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
    marginRight: 8,
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginHorizontal: 4,
  },
  avatarButton: {
    padding: 2,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: '#065F46',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    width: 280,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  dropdownHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 12,
    textAlign: 'center',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  dropdownItemText: {
    fontSize: 15,
    color: COLORS.textDark,
  },
  dropdownItemTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
export default AppHeader;
