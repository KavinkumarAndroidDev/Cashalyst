import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import theme from '../utils/theme';

const AppSegmentedButton = ({
  items = [],
  selectedIndex = 0,
  onSelect = () => {},
  style = {},
}) => {
  return (
    <View style={[{
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      borderRadius: theme.radii.button,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
    }, style]}>
      {items.map((item, idx) => {
        const isSelected = idx === selectedIndex;
        return (
          <TouchableOpacity
            key={typeof item === 'string' ? item : item.label}
            style={{
              flex: 1,
              paddingVertical: 10,
              backgroundColor: isSelected ? theme.colors.accent : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              borderRightWidth: idx < items.length - 1 ? 1 : 0,
              borderRightColor: theme.colors.border,
            }}
            activeOpacity={0.85}
            onPress={() => onSelect(idx)}
          >
            {item.icon ? item.icon : null}
            <Text style={{
              color: isSelected ? theme.colors.textMain : theme.colors.textSubtle,
              fontFamily: isSelected ? theme.font.family.bold : theme.font.family.medium,
              fontSize: theme.font.size.label,
            }}>
              {typeof item === 'string' ? item : item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default AppSegmentedButton; 