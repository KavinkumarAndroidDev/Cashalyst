import React, { useState } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity, Modal, ScrollView, FlatList } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import theme from '../utils/theme';
import { responsiveFontSize, moderateScale } from '../utils/scale';

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
  const [isOpen, setIsOpen] = useState(false);

  const selectedItem = items.find(item => {
    const value = typeof item === 'string' ? item : item.value;
    return value === selectedValue;
  });

  const selectedLabel = selectedItem 
    ? (typeof selectedItem === 'string' ? selectedItem : selectedItem.label)
    : placeholder || 'Select an option';

  const getItemLabel = (item) => {
    if (typeof item === 'string') return item;
    return item.fullLabel || item.label;
  };

  const handleSelect = (item) => {
    const value = typeof item === 'string' ? item : item.value;
    onValueChange(value);
    setIsOpen(false);
  };

  return (
    <View style={[styles.dropdownWrap, style]}>
      <TouchableOpacity
        style={[styles.dropdown, error && { borderColor: theme.colors.error }]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <View style={styles.dropdownContent}>
          <Text style={[
            styles.dropdownText,
            !selectedValue && { color: theme.colors.textSubtle }
          ]}>
            {selectedLabel}
          </Text>
        </View>
        <View style={styles.chevronWrap}>
          <ChevronDown 
            color={theme.colors.textSubtle} 
            size={20} 
            style={[styles.chevron, isOpen && styles.chevronRotated]}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.dropdownList}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {items.map((item, idx) => {
                  const value = typeof item === 'string' ? item : item.value;
                  const label = getItemLabel(item);
                  const isSelected = selectedValue === value;
                  
                  return (
                    <TouchableOpacity
                      key={`${value}-${label}-${idx}`}
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemSelected
                      ]}
                      onPress={() => handleSelect(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.dropdownItemContent}>
                      <Text style={[
                        styles.dropdownItemText,
                        isSelected && styles.dropdownItemTextSelected
                      ]}>
                        {label}
                      </Text>
                        {isSelected && (
                          <Check color={theme.colors.accent} size={16} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  dropdownContent: {
    flex: 1,
    justifyContent: 'center',
  },
  dropdownText: {
    color: theme.colors.textMain,
    fontFamily: theme.font.family.medium,
    fontSize: theme.font.size.label,
  },
  chevronWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: 300,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemText: {
    color: theme.colors.textSubtle,
    fontFamily: theme.font.family.medium,
    fontSize: theme.font.size.label,
  },
  dropdownItemTextSelected: {
    color: theme.colors.textMain,
    fontFamily: theme.font.family.bold,
  },
});

export default AppDropdown; 