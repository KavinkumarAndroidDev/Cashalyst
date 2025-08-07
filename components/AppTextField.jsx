import React from 'react';
import { TextInput } from 'react-native-paper';
import theme from '../utils/theme';
import { responsiveFontSize, moderateScale } from '../utils/scale';

const AppTextField = ({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  style = {},
  error = false,
  helperText = '',
  ...props
}) => {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      mode="outlined"
      style={[{ marginBottom: theme.spacing.md }, style]}
      outlineColor={error ? theme.colors.error : theme.colors.border}
      activeOutlineColor={theme.colors.accent}
      textColor={theme.colors.textMain}
      placeholderTextColor={theme.colors.textSubtle}
      // Theme configuration for consistent styling
      theme={{
        colors: {
          background: theme.colors.input,
          text: theme.colors.textMain,
          placeholder: theme.colors.textSubtle,
          primary: theme.colors.accent,
          error: theme.colors.error,
        },
        roundness: theme.radii.input,
        fonts: {
          regular: { fontFamily: theme.font.family.regular },
          medium: { fontFamily: theme.font.family.medium },
        },
      }}
      error={error}
      {...props}
    />
  );
};

export default AppTextField; 