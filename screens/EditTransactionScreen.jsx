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
  // Get account data and transaction update function from Zustand store
  const { accounts, updateTransaction, loading } = useStore();
  const transaction = route?.params?.transaction; // Get transaction from route params
  
  // Initialize form with existing transaction data
  const [formData, setFormData] = useState({
    title: transaction?.title || '',
    amount: transaction?.amount?.toString() || '', // Convert number to string for input
    type: transaction?.type || 'expense',
    category: transaction?.category || '',
    source: transaction?.source || '',
    date: transaction?.date || new Date().toISOString().split('T')[0], // Use transaction date or current date
    note: transaction?.note || '',
  });
  
  // UI state management
  const [localLoading, setLocalLoading] = useState(false); // Local loading state for better UX
  const [showSuccess, setShowSuccess] = useState(false); // Success message visibility
  const [errorModalVisible, setErrorModalVisible] = useState(false); // Error modal visibility
  const [errorMessage, setErrorMessage] = useState(''); // Error message text

  // Transaction type options with icons
  const transactionTypes = [
    { value: 'expense', label: 'Expense', icon: ArrowUpCircle },
    { value: 'income', label: 'Income', icon: ArrowDownCircle },
  ];

  // Category options organized by transaction type
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

  // Update form field with new value
  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle form submission for updating transaction
  const handleSubmit = async () => {
    if (localLoading) return; // Prevent multiple submissions
    
    // Form validation
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
      // Create updated transaction object
      const updatedTransaction = {
        ...transaction, // Preserve original transaction properties
        title: formData.title.trim(),
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        source: formData.source,
        date: formData.date,
        note: formData.note.trim(),
      };
      
      // Optimistically update UI for immediate feedback
      updateTransaction(updatedTransaction);
      setShowSuccess(true);
      
      // Simulate persistence delay for better UX
      await new Promise(res => setTimeout(res, 350));
    } catch (error) {
      setErrorMessage('Failed to update transaction. Please try again.');
      setErrorModalVisible(true);
    } finally {
      setLocalLoading(false);
    }
  };

  // Check if form is valid for submission
  const canSubmit = () => {
    return (
      formData.title.trim() && // Title must not be empty
      formData.amount && // Amount must be provided
      parseFloat(formData.amount) > 0 && // Amount must be positive
      formData.category && // Category must be selected
      formData.source // Source must be selected
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      {/* Header with navigation and title */}
      <View style={{ paddingTop: 20, paddingBottom: 20, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppButton
            style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border }}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack(); // Go back if possible
              } else {
                navigation.navigate('Main', { screen: 'History' }); // Navigate to history if can't go back
              }
            }}
          >
            <ArrowLeft color={theme.colors.textMain} size={22} />
          </AppButton>
          <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.section, color: theme.colors.textMain, letterSpacing: -0.3 }}>Edit Transaction</Text>
          <View style={{ width: 40 }} /> {/* Spacer for balanced layout */}
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Surface style={{ borderRadius: theme.radii.card, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
          {/* Transaction Type Selection */}
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Transaction type</Text>
          <View style={{ flexDirection: 'row', marginBottom: 24 }}>
            {transactionTypes.map(type => {
              const Icon = type.icon; // Get icon component for this type
              const isActive = formData.type === type.value; // Check if this type is selected
              return (
                <TouchableOpacity
                  key={type.value}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isActive ? theme.colors.accent : theme.colors.card, // Active/inactive background
                    borderRadius: theme.radii.button,
                    height: 48,
                    marginRight: type.value === 'expense' ? 8 : 0, // Add margin between buttons
                    borderWidth: isActive ? 0 : 1,
                    borderColor: theme.colors.border,
                  }}
                  onPress={() => updateForm('type', type.value)} // Update form with selected type
                  activeOpacity={0.85}
                >
                  <Icon color={isActive ? theme.colors.textMain : theme.colors.textSubtle} size={20} style={{ marginRight: 8 }} />
                  <Text style={{ color: isActive ? theme.colors.textMain : theme.colors.textSubtle, fontFamily: theme.font.family.medium, fontSize: theme.font.size.label }}>{type.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* Amount Input with Currency Symbol */}
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Enter amount</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: theme.colors.textSubtle, fontFamily: theme.font.family.medium, fontSize: 20, marginRight: 8 }}>₹</Text>
            <AppTextField
              value={formData.amount}
              onChangeText={text => updateForm('amount', text)} // Update amount in form
              keyboardType="numeric"
              style={{ flex: 1 }}
              placeholder="0.00"
            />
          </View>
          {/* Transaction Title Input */}
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Title</Text>
          <AppTextField
            value={formData.title}
            onChangeText={text => updateForm('title', text)} // Update title in form
            style={{ marginBottom: 24 }}
            placeholder="e.g., Coffee, Salary, Groceries"
          />
          {/* Category Dropdown Selection */}
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Category</Text>
          <AppDropdown
            items={categories[formData.type].map(cat => ({ label: cat, value: cat }))} // Categories change based on transaction type
            selectedValue={formData.category}
            onValueChange={value => updateForm('category', value)} // Update category in form
            placeholder="Select category"
            style={{ marginBottom: 24 }}
          />
          {/* Account Source Selection */}
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Source</Text>
          <AppDropdown
            items={accounts.map(account => ({ label: account.name, value: account.name }))} // Map accounts to dropdown items
            selectedValue={formData.source}
            onValueChange={value => updateForm('source', value)} // Update source in form
            style={{ marginBottom: 24 }}
          />
          {/* Account Balance Impact Preview (considers original transaction) */}
          {formData.source && formData.amount && (
            <View style={{ 
              backgroundColor: formData.type === 'expense' && parseFloat(formData.amount) > (accounts.find(acc => acc.name === formData.source)?.balance || 0) + (transaction.type === 'expense' ? transaction.amount : -transaction.amount)
                ? 'rgba(239, 68, 68, 0.08)' // Red background for insufficient balance
                : 'rgba(59, 130, 246, 0.08)', // Blue background for sufficient balance
              borderRadius: 12, 
              padding: 16, 
              marginBottom: 24, 
              borderWidth: 1, 
              borderColor: formData.type === 'expense' && parseFloat(formData.amount) > (accounts.find(acc => acc.name === formData.source)?.balance || 0) + (transaction.type === 'expense' ? transaction.amount : -transaction.amount)
                ? 'rgba(239, 68, 68, 0.2)' // Red border for insufficient balance
                : 'rgba(59, 130, 246, 0.2)' // Blue border for sufficient balance
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
                  color: formData.type === 'income' ? '#10B981' : '#EF4444' // Green for income, red for expense
                }}>
                  {formData.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(formData.amount))}
                </Text>
              </View>
              
              {/* Warning for insufficient balance (accounts for original transaction) */}
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
              
              {/* Confirmation for sufficient balance (accounts for original transaction) */}
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
          {/* Date Input with Calendar Icon */}
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Date</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <Calendar color={theme.colors.textSubtle} size={20} style={{ marginRight: 8 }} />
            <AppTextField
              value={formData.date}
              onChangeText={text => updateForm('date', text)} // Update date in form
              style={{ flex: 1 }}
              placeholder="YYYY-MM-DD"
            />
          </View>
          {/* Optional Note Input */}
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Note (optional)</Text>
          <AppTextField
            value={formData.note}
            onChangeText={text => updateForm('note', text)} // Update note in form
            style={{ marginBottom: 24 }}
            placeholder="Add a note (optional)"
          />
          {/* Submit Button with Loading State */}
          <AppButton
            style={{ marginTop: theme.spacing.lg }}
            onPress={handleSubmit}
            disabled={!canSubmit() || localLoading} // Disable when form invalid or loading
          >
            <Text style={{ color: theme.colors.textMain, fontFamily: theme.font.family.bold, fontSize: theme.font.size.label }}>
              {localLoading ? 'Saving...' : 'Save Changes'} {/* Dynamic button text */}
            </Text>
            {localLoading && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />} {/* Loading indicator */}
          </AppButton>
        </Surface>
      </ScrollView>
      {/* Success Message Snackbar */}
      <Snackbar
        visible={showSuccess}
        onDismiss={() => setShowSuccess(false)}
        duration={1800}
        style={{ backgroundColor: theme.colors.accent, marginBottom: 32, marginHorizontal: 16, borderRadius: 12 }}
      >
        <Text style={{ color: '#fff', fontFamily: theme.font.family.medium, textAlign: 'center' }}>Transaction updated successfully</Text>
      </Snackbar>
      
      {/* Error Modal for Validation and Operation Errors */}
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