import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { TextInput, Surface, SegmentedButtons } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import useStore from '../hooks/useStore';
import { generateId } from '../utils/formatCurrency';
import theme from '../utils/theme';
import { PlusCircle, ArrowDownCircle, ArrowUpCircle, Calendar, Tag, Wallet, FileText, ArrowLeft } from 'lucide-react-native';
import AppButton from '../components/AppButton';
import AppTextField from '../components/AppTextField';
import AppDropdown from '../components/AppDropdown';

const AddTransactionScreen = ({ navigation }) => {
  const { accounts, addTransaction, loading } = useStore();
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: '',
    source: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const transactionTypes = [
    { value: 'expense', label: 'Expense', icon: ArrowUpCircle },
    { value: 'income', label: 'Income', icon: ArrowDownCircle },
  ];

  const categories = {
    expense: [
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Bills & Utilities',
      'Healthcare',
      'Education',
      'Travel',
      'Other',
    ],
    income: [
      'Salary',
      'Freelance',
      'Investment',
      'Gift',
      'Refund',
      'Other',
    ],
  };

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a transaction title');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!formData.category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!formData.source) {
      Alert.alert('Error', 'Please select a source');
      return;
    }
    try {
      const transaction = {
        id: generateId(),
        title: formData.title.trim(),
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        source: formData.source,
        date: formData.date,
        note: formData.note.trim(),
      };
      await addTransaction(transaction);
      Alert.alert(
        'Success!',
        'Transaction added successfully',
        [
          {
            text: 'Add Another',
            onPress: () => {
              setFormData({
                title: '',
                amount: '',
                type: 'expense',
                category: '',
                source: '',
                date: new Date().toISOString().split('T')[0],
                note: '',
              });
            },
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction. Please try again.');
    }
  };

  const canSubmit = () => {
    return (
      formData.title.trim() &&
      formData.amount &&
      parseFloat(formData.amount) > 0 &&
      formData.category &&
      formData.source
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      {/* Header */}
      <View style={{ paddingTop: 60, paddingBottom: 20, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppButton
            style={{ width: 40, height: 40, borderRadius: theme.radii.button, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border }}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color={theme.colors.textMain} size={22} />
          </AppButton>
          <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.section, color: theme.colors.textMain, letterSpacing: -0.3 }}>Add Transaction</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Surface style={{ borderRadius: theme.radii.card, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
          {/* Transaction Type */}
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Transaction type</Text>
          <View style={{ flexDirection: 'row', marginBottom: theme.spacing.lg }}>
            {transactionTypes.map(type => {
              const Icon = type.icon;
              const isActive = formData.type === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isActive ? theme.colors.accent : theme.colors.card,
                    borderRadius: theme.radii.button,
                    height: 48,
                    marginRight: type.value === 'expense' ? 8 : 0,
                    borderWidth: isActive ? 0 : 1,
                    borderColor: theme.colors.border,
                  }}
                  onPress={() => updateForm('type', type.value)}
                  activeOpacity={0.85}
                >
                  <Icon color={isActive ? theme.colors.textMain : theme.colors.textSubtle} size={20} style={{ marginRight: 8 }} />
                  <Text style={{ color: isActive ? theme.colors.textMain : theme.colors.textSubtle, fontFamily: theme.font.family.medium, fontSize: theme.font.size.label }}>{type.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* Amount Input */}
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Enter amount</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.lg }}>
            <Text style={{ color: theme.colors.textSubtle, fontFamily: theme.font.family.medium, fontSize: 20, marginRight: 8 }}>₹</Text>
            <AppTextField
              value={formData.amount}
              onChangeText={text => updateForm('amount', text)}
              keyboardType="numeric"
              style={{ flex: 1 }}
              placeholder="0.00"
            />
          </View>
          {/* Title Input */}
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Title</Text>
          <AppTextField
            value={formData.title}
            onChangeText={text => updateForm('title', text)}
            style={{ marginBottom: theme.spacing.lg }}
            placeholder="e.g., Coffee, Salary, Groceries"
          />
          {/* Category Selection */}
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Category</Text>
          <AppDropdown
            items={categories[formData.type]}
            selectedValue={formData.category}
            onValueChange={value => updateForm('category', value)}
            style={{ marginBottom: theme.spacing.lg }}
          />
          {/* Source Selection */}
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Source</Text>
          <AppDropdown
            items={accounts.map(account => ({ label: account.name, value: account.name }))}
            selectedValue={formData.source}
            onValueChange={value => updateForm('source', value)}
            style={{ marginBottom: theme.spacing.lg }}
          />
          {/* Date Input */}
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Date</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.lg }}>
            <Calendar color={theme.colors.textSubtle} size={20} style={{ marginRight: 8 }} />
            <AppTextField
              value={formData.date}
              onChangeText={text => updateForm('date', text)}
              style={{ flex: 1 }}
              placeholder="YYYY-MM-DD"
            />
          </View>
          {/* Note Input */}
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Note (optional)</Text>
          <AppTextField
            value={formData.note}
            onChangeText={text => updateForm('note', text)}
            style={{ marginBottom: theme.spacing.lg }}
            placeholder="Add a note..."
          />
        </Surface>
        {/* Submit Button */}
        <AppButton
          style={{ marginTop: theme.spacing.lg, alignSelf: 'center', minWidth: 220, ...theme.button.filled, opacity: loading || !canSubmit() ? 0.6 : 1 }}
          onPress={handleSubmit}
          disabled={loading || !canSubmit()}
          activeOpacity={0.85}
        >
          <Text style={theme.button.filledLabel}>{loading ? 'Adding...' : 'Add Transaction'}</Text>
        </AppButton>
      </ScrollView>
    </View>
  );
};

export default AddTransactionScreen; 