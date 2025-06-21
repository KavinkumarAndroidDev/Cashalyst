import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ChevronDown } from 'lucide-react-native';
import theme from '../utils/theme';

const AppDropdown = ({
  selectedValue,
  onValueChange,
  items = [],
  placeholder = '',
  style = {},
  error = false,
  helperText = '',
  ...props
}) => {
  return (
    <View style={[styles.dropdownWrap, style]}>
      <View style={[styles.dropdown, error && { borderColor: theme.colors.error }]}> 
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={styles.picker}
          dropdownIconColor={theme.colors.textSubtle}
          {...props}
        >
          {placeholder ? (
            <Picker.Item label={placeholder} value="" color={theme.colors.textSubtle} key="placeholder" />
          ) : null}
          {items.map((item, idx) => {
            const value = typeof item === 'string' ? item : item.value;
            const label = typeof item === 'string' ? item : item.label;
            return (
              <Picker.Item
                label={label}
                value={value}
                color={selectedValue === value ? theme.colors.textMain : theme.colors.textSubtle}
                style={styles.pickerItem}
                key={`${value}-${label}-${idx}`}
              />
            );
          })}
        </Picker>
        <View style={styles.chevronWrap} pointerEvents="none">
          <ChevronDown color={theme.colors.textSubtle} size={20} />
        </View>
      </View>
      {helperText ? (
        <Text style={{ color: error ? theme.colors.error : theme.colors.textHelper, fontSize: theme.font.size.note, marginTop: 4 }}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownWrap: {
    marginBottom: theme.spacing.md,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.input,
    backgroundColor: theme.colors.input,
    height: 56,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    paddingRight: 36,
  },
  picker: {
    color: theme.colors.textMain,
    fontFamily: theme.font.family.medium,
    fontSize: theme.font.size.label,
    height: 56,
    width: '100%',
    backgroundColor: 'transparent',
    ...Platform.select({
      android: { paddingLeft: 8 },
      ios: { paddingLeft: 0 },
    }),
  },
  pickerItem: {
    fontFamily: theme.font.family.medium,
    fontSize: theme.font.size.label,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  chevronWrap: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    zIndex: 1,
  },
});

export default AppDropdown; 