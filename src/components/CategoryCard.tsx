import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAppNavigation } from '../navigation/NavigationContext';

interface CategoryCardProps {
  category: string;
  isActive: boolean;
  onPress: () => void;
}

export const CategoryCard = ({ category, isActive, onPress }: CategoryCardProps) => {
  const { tCategory } = useAppNavigation();

  // Get matching icon name based on category
  const getIcon = () => {
    switch (category) {
      case 'Agriculture':
        return 'sprout';
      case 'Education':
        return 'school';
      case 'Health':
        return 'heart-pulse';
      case 'Housing':
        return 'home-city';
      case 'Employment':
        return 'briefcase-variant';
      case 'Women & Child':
        return 'human-female-boy';
      case 'Pension':
        return 'wallet-membership';
      case 'Disability':
        return 'wheelchair-accessibility';
      default:
        return 'tag';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.cardContainer,
        isActive && styles.cardActive
      ]}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          isActive && styles.iconActive
        ]}
      >
        <MaterialCommunityIcons
          name={getIcon() as any}
          size={24}
          color={isActive ? COLORS.white : COLORS.primary}
        />
      </View>
      <Text
        style={[
          styles.labelText,
          isActive && styles.labelActive
        ]}
        numberOfLines={2}
      >
        {tCategory(category)}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    minWidth: '22%',
    maxWidth: '23%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    aspectRatio: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  cardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconActive: {
    backgroundColor: COLORS.primary,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  labelActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
export default CategoryCard;
