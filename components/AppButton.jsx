import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import theme from '../utils/theme';
import { responsiveFontSize, moderateScale } from '../utils/scale';

// Button style variants
const VARIANT_STYLES = {
  filled: theme.button.filled,
  outlined: theme.button.outlined,
  text: theme.button.text,
  danger: theme.button.danger,
};

// Text styles for each variant
const VARIANT_LABELS = {
  filled: theme.button.filledLabel,
  outlined: theme.button.outlinedLabel,
  text: theme.button.textLabel,
  danger: theme.button.dangerLabel,
};

const AppButton = ({
  title,
  onPress,
  variant = 'filled',
  style = {},
  labelStyle = {},
  disabled = false,
  loading = false,
  fullWidth = false,
  children,
  ...props
}) => {
  // Combine base styles with conditional and custom styles
  const buttonStyle = [
    VARIANT_STYLES[variant] || VARIANT_STYLES.filled,
    disabled ? { opacity: 0.6 } : {},
    fullWidth ? { alignSelf: 'stretch' } : {},
    style,
  ];

  const textStyle = [
    VARIANT_LABELS[variant] || VARIANT_LABELS.filled,
    labelStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.textMain} />
      ) : (
        children ? children : <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default AppButton; 