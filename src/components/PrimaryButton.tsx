import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '../constants/colors';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}

export const PrimaryButton = ({
  title,
  onPress,
  style,
  textStyle,
  variant = 'primary',
}: PrimaryButtonProps) => {
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';
  const isOutline = variant === 'outline';

  const getButtonStyle = () => {
    if (isSecondary) return styles.buttonSecondary;
    if (isDanger) return styles.buttonDanger;
    if (isOutline) return styles.buttonOutline;
    return styles.buttonPrimary;
  };

  const getTextStyle = () => {
    if (isOutline) return styles.textOutline;
    if (isSecondary) return styles.textSecondary;
    return styles.textPrimary;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.buttonBase, getButtonStyle(), style]}
      activeOpacity={0.8}
    >
      <Text style={[styles.textBase, getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
  },
  buttonDanger: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  textBase: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  textPrimary: {
    color: COLORS.white,
  },
  textSecondary: {
    color: COLORS.primary,
  },
  textOutline: {
    color: COLORS.primary,
  },
});
export default PrimaryButton;
