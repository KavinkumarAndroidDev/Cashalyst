import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Keyboard, TouchableOpacity } from 'react-native';
import { Surface } from 'react-native-paper';
import { X, Search } from 'lucide-react-native';
import theme from '../utils/theme';
import { responsiveFontSize, moderateScale } from '../utils/scale';

const AppSearchBar = ({ onSearch, placeholder = 'Search transactions...', style }) => {
  const inputRef = useRef();
  const [inputValue, setInputValue] = useState('');

  // Handle text input changes
  const handleChange = (text) => {
    setInputValue(text);
  };

  // Handle search submission
  const handleSubmit = () => {
    onSearch && onSearch(inputValue);
    Keyboard.dismiss();
  };

  // Clear search input and reset
  const handleClear = () => {
    setInputValue('');
    onSearch && onSearch('');
    inputRef.current?.focus();
  };

  return (
    <Surface style={[styles.container, style]}>  
      <Search color={theme.colors.accent} size={20} style={{ marginLeft: 8, marginRight: 4 }} />
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textHelper}
        value={inputValue}
        onChangeText={handleChange}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
        blurOnSubmit={true}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {/* Clear button - only show when there's input */}
      {inputValue ? (
        <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
          <X color={theme.colors.textSubtle} size={18} />
        </TouchableOpacity>
      ) : null}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 2,
    shadowOpacity: 0.08,
    paddingHorizontal: 4,
    height: 48,
    marginBottom: 0,
  },
  input: {
    flex: 1,
    color: theme.colors.textMain,
    fontFamily: theme.font.family.bold,
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 8,
  },
  clearBtn: {
    padding: 6,
    marginRight: 4,
  },
});

export default AppSearchBar; 