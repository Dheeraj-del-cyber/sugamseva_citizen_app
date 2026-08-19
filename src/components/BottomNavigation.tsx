import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAppNavigation, TabName } from '../navigation/NavigationContext';

export const BottomNavigation = () => {
  const { currentTab, setTab, t } = useAppNavigation();

  const tabs: { id: TabName; labelKey: 'appName' | 'discoverSchemes' | 'aiCardSub' | 'trackApp' | 'profile'; icon: string }[] = [
    { id: 'Home', labelKey: 'appName', icon: 'home' },
    { id: 'Schemes', labelKey: 'discoverSchemes', icon: 'search' },
    { id: 'AI', labelKey: 'aiCardSub', icon: 'mic' }, // Centered mic
    { id: 'Track', labelKey: 'trackApp', icon: 'time' },
    { id: 'Profile', labelKey: 'profile', icon: 'person' },
  ];

  return (
    <View style={styles.navContainer}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;

        if (tab.id === 'AI') {
          return (
            <View key={tab.id} style={styles.micContainer}>
              <TouchableOpacity
                onPress={() => setTab('AI')}
                style={styles.micButton}
                activeOpacity={0.8}
                accessibilityLabel="Activate voice assistant"
              >
                <Ionicons name="mic" size={28} color={COLORS.white} />
              </TouchableOpacity>
              <Text style={styles.micLabel}>{t(tab.labelKey)}</Text>
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setTab(tab.id)}
            style={styles.tabItem}
            activeOpacity={0.6}
          >
            <Ionicons
              name={isActive ? (tab.icon as any) : (`${tab.icon}-outline` as any)}
              size={22}
              color={isActive ? COLORS.primary : COLORS.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.tabLabelActive : null
              ]}
              numberOfLines={1}
            >
              {tab.id === 'Home' ? 'Home' : tab.id === 'Schemes' ? 'Schemes' : tab.id === 'Track' ? 'Track' : 'Profile'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    height: 70,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 8,
    position: 'relative',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: -3 },
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  micContainer: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    top: -15, // Lift the button up
  },
  micButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  micLabel: {
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
export default BottomNavigation;
