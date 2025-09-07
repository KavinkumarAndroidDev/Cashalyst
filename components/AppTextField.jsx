import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import theme from '../utils/theme';

// Create stable styles outside component
const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
});

const AppTextField = React.memo(({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  style,
  error = false,
  helperText = '',
  ...props
}) => {
  // Stabilize the onChangeText callback to prevent unnecessary re-renders
  const handleChangeText = useCallback((text) => {
    onChangeText?.(text);
  }, [onChangeText]);

  return (
    <View style={[styles.container, style]}>
      <TextInput
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        mode="outlined"
        outlineColor={error ? theme.colors.error : theme.colors.border}
        activeOutlineColor={theme.colors.accent}
        theme={theme.textInputTheme}
        error={error}
        blurOnSubmit={false}
        returnKeyType="done"
        {...props}
      />
      {helperText ? (
        <HelperText type={error ? 'error' : 'info'} visible={!!helperText}>
          {helperText}
        </HelperText>
      ) : null}
    </View>
  );
});

AppTextField.displayName = 'AppTextField';

export default AppTextField; 