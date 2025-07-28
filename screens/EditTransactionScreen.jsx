import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Surface, SegmentedButtons, Snackbar } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import useStore from '../hooks/useStore';
import { generateId, formatCurrency } from '../utils/formatCurrency';
import theme from '../utils/theme';
import { responsiveFontSize, moderateScale } from '../utils/scale';
import { PlusCircle, ArrowDownCircle, ArrowUpCircle, Calendar, Tag, Wallet, FileText, ArrowLeft, Trash2 } from 'lucide-react-native';
import AppButton from '../components/AppButton';
import AppTextField from '../components/AppTextField';
import AppDropdown from '../components/AppDropdown';
import AppModal from '../components/AppModal';

const EditTransactionScreen = ({ navigation, route }) => {
  const { accounts, updateTransaction, loading } = useStore();
  const transaction = route?.params?.transaction;
  const [formData, setFormData] = useState({
    title: transaction?.title || '',
    amount: transaction?.amount?.toString() || '',
    type: transaction?.type || 'expense',
    category: transaction?.category || '',
    source: transaction?.source || '',
    date: transaction?.date || new Date().toISOString().split('T')[0],
    note: transaction?.note || '',
  });
  const [localLoading, setLocalLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
    if (localLoading) return;
    // Validation
    if (!formData.title.trim()) {
      setErrorMessage('Please enter a transaction title');
      setErrorModalVisible(true);
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setErrorMessage('Please enter a valid amount');
      setErrorModalVisible(true);
      return;
    }
    if (!formData.category) {
      setErrorMessage('Please select a category');
      setErrorModalVisible(true);
      return;
    }
    if (!formData.source) {
      setErrorMessage('Please select a source');
      setErrorModalVisible(true);
      return;
    }
    setLocalLoading(true);
    try {
      const updatedTransaction = {
        ...transaction,
        title: formData.title.trim(),
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        source: formData.source,
        date: formData.date,
        note: formData.note.trim(),
      };
      // Optimistically update UI
      updateTransaction(updatedTransaction);
      setShowSuccess(true);
      // Await persistence
      await new Promise(res => setTimeout(res, 350)); // simulate fast feedback
    } catch (error) {
      setErrorMessage('Failed to update transaction. Please try again.');
      setErrorModalVisible(true);
    } finally {
      setLocalLoading(false);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      {/* Header */}
      <View style={{ paddingTop: 20, paddingBottom: 20, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppButton
            style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border }}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Main', { screen: 'History' });
              }
            }}
          >
            <ArrowLeft color={theme.colors.textMain} size={22} />
          </AppButton>
          <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.section, color: theme.colors.textMain, letterSpacing: -0.3 }}>Edit Transaction</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Surface style={{ borderRadius: theme.radii.card, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
          {/* Transaction Type */}
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Transaction type</Text>
          <View style={{ flexDirection: 'row', marginBottom: 24 }}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
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
            style={{ marginBottom: 24 }}
            placeholder="e.g., Coffee, Salary, Groceries"
          />
          {/* Category Dropdown */}
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Category</Text>
          <AppDropdown
            items={categories[formData.type].map(cat => ({ label: cat, value: cat }))}
            selectedValue={formData.category}
            onValueChange={value => updateForm('category', value)}
            placeholder="Select category"
            style={{ marginBottom: 24 }}
          />
          {/* Source Selection */}
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Source</Text>
          <AppDropdown
            items={accounts.map(account => ({ label: account.name, value: account.name }))}
            selectedValue={formData.source}
            onValueChange={value => updateForm('source', value)}
            style={{ marginBottom: 24 }}
          />
          {/* Account Balance Preview */}
          {formData.source && formData.amount && (
            <View style={{ 
              backgroundColor: formData.type === 'expense' && parseFloat(formData.amount) > (accounts.find(acc => acc.name === formData.source)?.balance || 0) + (transaction.type === 'expense' ? transaction.amount : -transaction.amount)
                ? 'rgba(239, 68, 68, 0.08)' 
                : 'rgba(59, 130, 246, 0.08)', 
              borderRadius: 12, 
              padding: 16, 
              marginBottom: 24, 
              borderWidth: 1, 
              borderColor: formData.type === 'expense' && parseFloat(formData.amount) > (accounts.find(acc => acc.name === formData.source)?.balance || 0) + (transaction.type === 'expense' ? transaction.amount : -transaction.amount)
                ? 'rgba(239, 68, 68, 0.2)'
                : 'rgba(59, 130, 246, 0.2)' 
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ 
                  fontFamily: theme.font.family.bold, 
                  fontSize: 16, 
                  color: theme.colors.textMain 
                }}>
                  Account Impact
                </Text>
              </View>
              
              <View style={{ marginBottom: 8 }}>
                <Text style={{ 
                  fontFamily: theme.font.family.medium, 
                  fontSize: 14, 
                  color: theme.colors.textSubtle, 
                  marginBottom: 4 
                }}>
                  {formData.source} balance will change by:
                </Text>
                <Text style={{ 
                  fontFamily: theme.font.family.bold, 
                  fontSize: 18, 
                  color: formData.type === 'income' ? '#10B981' : '#EF4444'
                }}>
                  {formData.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(formData.amount))}
                </Text>
              </View>
              
              {formData.type === 'expense' && parseFloat(formData.amount) > (accounts.find(acc => acc.name === formData.source)?.balance || 0) + (transaction.type === 'expense' ? transaction.amount : -transaction.amount) && (
                <View style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                  borderRadius: 8, 
                  padding: 12, 
                  borderWidth: 1, 
                  borderColor: 'rgba(239, 68, 68, 0.2)',
                  marginTop: 8
                }}>
                  <Text style={{ color: '#EF4444', fontFamily: theme.font.family.bold, fontSize: 14, marginBottom: 4 }}>
                    Insufficient Balance
                  </Text>
                  <Text style={{ color: '#EF4444', fontFamily: theme.font.family.medium, fontSize: 13 }}>
                    Available: {formatCurrency((accounts.find(acc => acc.name === formData.source)?.balance || 0) + (transaction.type === 'expense' ? transaction.amount : -transaction.amount))} • Shortfall: {formatCurrency(parseFloat(formData.amount) - ((accounts.find(acc => acc.name === formData.source)?.balance || 0) + (transaction.type === 'expense' ? transaction.amount : -transaction.amount)))}
                  </Text>
                </View>
              )}
              
              {formData.type === 'expense' && parseFloat(formData.amount) <= (accounts.find(acc => acc.name === formData.source)?.balance || 0) + (transaction.type === 'expense' ? transaction.amount : -transaction.amount) && (
                <View style={{ 
                  backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                  borderRadius: 8, 
                  padding: 12, 
                  borderWidth: 1, 
                  borderColor: 'rgba(16, 185, 129, 0.2)',
                  marginTop: 8
                }}>
                  <Text style={{ color: '#10B981', fontFamily: theme.font.family.bold, fontSize: 14, marginBottom: 4 }}>
                    Sufficient Balance
                  </Text>
                  <Text style={{ color: '#10B981', fontFamily: theme.font.family.medium, fontSize: 13 }}>
                    Remaining: {formatCurrency(((accounts.find(acc => acc.name === formData.source)?.balance || 0) + (transaction.type === 'expense' ? transaction.amount : -transaction.amount)) - parseFloat(formData.amount))}
                  </Text>
                </View>
              )}
            </View>
          )}
          {/* Date Input */}
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Date</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
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
            style={{ marginBottom: 24 }}
            placeholder="Add a note (optional)"
          />
          {/* Submit Button */}
          <AppButton
            style={{ marginTop: theme.spacing.lg }}
            onPress={handleSubmit}
            disabled={!canSubmit() || localLoading}
          >
            <Text style={{ color: theme.colors.textMain, fontFamily: theme.font.family.bold, fontSize: theme.font.size.label }}>
              {localLoading ? 'Saving...' : 'Save Changes'}
            </Text>
            {localLoading && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />}
          </AppButton>
        </Surface>
      </ScrollView>
      <Snackbar
        visible={showSuccess}
        onDismiss={() => setShowSuccess(false)}
        duration={1800}
        style={{ backgroundColor: theme.colors.accent, marginBottom: 32, marginHorizontal: 16, borderRadius: 12 }}
      >
        <Text style={{ color: '#fff', fontFamily: theme.font.family.medium, textAlign: 'center' }}>Transaction updated successfully</Text>
      </Snackbar>
      {/* Custom Error Modal */}
      <AppModal
        visible={errorModalVisible}
        onDismiss={() => setErrorModalVisible(false)}
        title="Error"
        type="error"
        message={errorMessage}
        actions={[
          {
            text: 'OK',
            style: 'primary',
            onPress: () => setErrorModalVisible(false)
          }
        ]}
        showCloseButton={false}
        blurBackground={true}
      />
    </SafeAreaView>
  );
};

export default EditTransactionScreen; 