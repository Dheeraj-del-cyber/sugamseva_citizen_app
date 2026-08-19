import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAppNavigation } from '../navigation/NavigationContext';
import { mockUser } from '../data/mockData';

export const ProfileScreen = () => {
  const { t, activeLanguage, setLanguage, pushScreen, setTab } = useAppNavigation();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => setTab('Home') }
      ]
    );
  };

  const getLanguageName = () => {
    switch (activeLanguage) {
      case 'kn':
        return 'ಕನ್ನಡ (Kannada)';
      case 'hi':
        return 'हिन्दी (Hindi)';
      default:
        return 'English';
    }
  };

  const menuOptions = [
    {
      icon: 'language-outline',
      label: t('languageOpt'),
      rightText: getLanguageName(),
      onPress: () => {
        // Toggle language as a shortcut
        if (activeLanguage === 'en') setLanguage('kn');
        else if (activeLanguage === 'kn') setLanguage('hi');
        else setLanguage('en');
      }
    },
    {
      icon: 'folder-open-outline',
      label: t('myDocuments'),
      rightText: 'DigiLocker',
      onPress: () => pushScreen('DigiLocker')
    },
    {
      icon: 'document-text-outline',
      label: t('myApplications'),
      onPress: () => setTab('Track')
    },
    {
      icon: 'notifications-outline',
      label: t('myAlerts'),
      onPress: () => Alert.alert("My Alerts", "You have no new alerts.")
    },
    {
      icon: 'help-circle-outline',
      label: t('helpSupport'),
      onPress: () => Alert.alert("Help & Support", "Support desk is available 24/7. Call 1800-XXX-XXXX")
    },
    {
      icon: 'settings-outline',
      label: t('settings'),
      onPress: () => Alert.alert("Settings", "App preferences.")
    },
    {
      icon: 'information-circle-outline',
      label: t('aboutSugam'),
      onPress: () => Alert.alert("About", "Sugam Seva v1.0.0. Developed by Government digital initiatives.")
    }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header Green Box */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: mockUser.avatar }} style={styles.avatar} />
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={12} color={COLORS.white} />
          </View>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{mockUser.name}</Text>
          <Text style={styles.userEmail}>{mockUser.email}</Text>
          <Text style={styles.userPhone}>{mockUser.phone}</Text>
        </View>

        <TouchableOpacity style={styles.arrowButton} accessibilityLabel="View profile details">
          <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Settings Options List */}
      <View style={styles.optionsCard}>
        {menuOptions.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={opt.onPress}
            style={[
              styles.optionItem,
              idx === menuOptions.length - 1 && styles.optionItemLast
            ]}
          >
            <View style={styles.optionLeft}>
              <View style={styles.optionIconCircle}>
                <Ionicons name={opt.icon as any} size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.optionLabel}>{opt.label}</Text>
            </View>

            <View style={styles.optionRight}>
              {opt.rightText && (
                <Text style={styles.optionRightText}>{opt.rightText}</Text>
              )}
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={handleLogout}
        style={styles.logoutButton}
        activeOpacity={0.7}
      >
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>
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
  profileHeaderCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primaryMedium,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.primaryLight,
    marginTop: 4,
  },
  userPhone: {
    fontSize: 12,
    color: COLORS.primaryLight,
    marginTop: 2,
  },
  arrowButton: {
    padding: 8,
  },
  optionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionItemLast: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionRightText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: 6,
  },
  logoutButton: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
});
export default ProfileScreen;
