import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface, FAB, Snackbar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '../hooks/useStore';
import { generateId, formatCurrency } from '../utils/formatCurrency';
import AppButton from '../components/AppButton';
import AppTextField from '../components/AppTextField';
import AppDropdown from '../components/AppDropdown';
import AppModal from '../components/AppModal';
import { ArrowLeft, PiggyBank, Coffee, Car, ShoppingCart, Film, Banknote, Calendar, FileText, Book, CreditCard, Pencil, Trash2 } from 'lucide-react-native';
import theme from '../utils/theme';
import { responsiveFontSize, moderateScale } from '../utils/scale';

const AccountsScreen = ({ navigation }) => {
  // Get account management functions from Zustand store
  const { accounts, addAccount, updateAccount, deleteAccount, getStats } = useStore();
  
  // Modal and form state management
  const [modalVisible, setModalVisible] = useState(false); // Controls add/edit modal visibility
  const [editingAccount, setEditingAccount] = useState(null); // Currently editing account (null for new)
  const [formData, setFormData] = useState({
    name: '',
    type: 'upi',
    balance: '',
  }); // Form data for account creation/editing
  
  // Statistics and UI state
  const [stats, setStats] = useState({
    totalBalance: 0,
  }); // Calculated statistics
  const [showSuccess, setShowSuccess] = useState(false); // Success message visibility
  const [successMsg, setSuccessMsg] = useState(''); // Success message text
  const [delayedLoading, setDelayedLoading] = useState(false); // Loading state for better UX
  const [balanceAnimation] = useState(new Animated.Value(1)); // Animation for balance changes
  const [lastBalance, setLastBalance] = useState(0); // Track previous balance for animations
  
  // Delete confirmation modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  
  // Error handling state
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  let loadingTimeout = null; // Timeout for delayed loading indicator

  // Update statistics and animate balance changes when accounts change
  useEffect(() => {
    const currentStats = getStats(); // Get updated statistics
    setStats(currentStats);
    
    // Animate balance change if it's different from last time (skip initial load)
    if (currentStats.totalBalance !== lastBalance && lastBalance !== 0) {
      Animated.sequence([
        Animated.timing(balanceAnimation, {
          toValue: 1.02, // Scale up slightly
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(balanceAnimation, {
          toValue: 1, // Return to normal size
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
    setLastBalance(currentStats.totalBalance); // Update last balance for next comparison
  }, [accounts]);

  // Account type definitions with labels and colors
  const sourceTypes = {
    upi: { label: 'UPI', color: '#3B82F6' },
    bank: { label: 'Bank Account', color: '#8B5CF6' },
    cash: { label: 'Cash', color: '#10B981' },
    wallet: { label: 'Digital Wallet', color: '#F59E0B' },
    custom: { label: 'Custom', color: '#EF4444' },
  };

  // Reset form to default values and clear editing state
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'upi',
      balance: '',
    });
    setEditingAccount(null); // Clear editing state
  };

  // Open modal for adding new account
  const openAddModal = () => {
    resetForm(); // Reset form to default values
    setModalVisible(true);
  };

  // Open modal for editing existing account
  const openEditModal = (account) => {
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(), // Convert number to string for input
    });
    setEditingAccount(account); // Set account being edited
    setModalVisible(true);
  };

  // Close modal and reset form
  const closeModal = () => {
    setModalVisible(false);
    resetForm(); // Reset form when closing
  };

  // Handle form submission for adding/editing accounts
  const handleSubmit = async () => {
    try {
      // Validate account name
      if (!formData.name.trim()) {
        setErrorMessage('Please enter an account name');
        setErrorModalVisible(true);
        return;
      }
      
      // Validate balance (must be positive number)
      if (!formData.balance || parseFloat(formData.balance) < 0) {
        setErrorMessage('Please enter a valid balance');
        setErrorModalVisible(true);
        return;
      }
      
      // Check for duplicate account names (case-insensitive, exclude current account when editing)
      const trimmedName = formData.name.trim();
      const existingAccount = accounts.find(account => 
        account.name.toLowerCase() === trimmedName.toLowerCase() && 
        (!editingAccount || account.id !== editingAccount.id)
      );
      if (existingAccount) {
        setErrorMessage(`An account with the name "${trimmedName}" already exists. Please choose a different name.`);
        setErrorModalVisible(true);
        return;
      }
      
      // Set up delayed loading for better UX
      setDelayedLoading(false);
      loadingTimeout = setTimeout(() => setDelayedLoading(true), 300);
      
      // Prepare account data
      const accountData = {
        name: trimmedName,
        type: formData.type,
        balance: parseFloat(formData.balance),
      };
      
      // Add or update account based on editing state
      if (editingAccount) {
        await updateAccount(editingAccount.id, accountData);
        setSuccessMsg('Account updated successfully');
      } else {
        await addAccount(accountData);
        setSuccessMsg('Account added successfully');
      }
      
      closeModal();
      setShowSuccess(true);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save account. Please try again.');
      setErrorModalVisible(true);
    } finally {
      clearTimeout(loadingTimeout);
      setDelayedLoading(false);
    }
  };

  // Open delete confirmation modal for account
  const handleDelete = (account) => {
    setAccountToDelete(account); // Set account to be deleted
    setDeleteModalVisible(true); // Show confirmation modal
  };

  // Confirm and execute account deletion
  const confirmDelete = async () => {
    if (!accountToDelete) return; // Safety check
    
    try {
      await deleteAccount(accountToDelete.id); // Delete from store
      setSuccessMsg('Account deleted successfully');
      setShowSuccess(true);
    } catch (error) {
      // You can add error modal here if needed
    } finally {
      setDeleteModalVisible(false); // Close modal
      setAccountToDelete(null); // Clear account reference
    }
  };

  // Group accounts by their type for organized display
  const getAccountsByType = () => {
    const grouped = {};
    Object.keys(sourceTypes).forEach(type => {
      grouped[type] = accounts.filter(account => account.type === type); // Filter accounts by type
    });
    return grouped;
  };

  const groupedAccounts = getAccountsByType(); // Get grouped accounts for rendering

  // Icon mappings for different account types
  const CATEGORY_ICONS = {
    upi: CreditCard,
    bank: Banknote,
    cash: PiggyBank,
    wallet: ShoppingCart,
    custom: PiggyBank,
  };
  
  // Color mappings for different account types
  const CATEGORY_COLORS = {
    upi: '#3B82F6',
    bank: '#8B5CF6',
    cash: '#10B981',
    wallet: '#F59E0B',
    custom: '#EF4444',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with navigation and title */}
      <View style={{ paddingTop: 20, paddingBottom: 20, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.background }}>
        <View style={styles.headerContent}>
          <AppButton
            style={styles.backButton}
            onPress={() => navigation.goBack()} // Navigate back to previous screen
          >
            <ArrowLeft color={theme.colors.textMain} size={22} />
          </AppButton>
          <Text style={styles.headerTitle}>Money Sources</Text>
          <View style={styles.placeholder} /> {/* Spacer for balanced layout */}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Balance Card with animated balance display */}
        <Surface style={[styles.balanceCard, { transform: [{ scale: balanceAnimation }] }]}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.1)', 'rgba(37, 99, 235, 0.05)']}
            style={styles.balanceGradient}
          >
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(stats.totalBalance)} {/* Display formatted total balance */}
            </Text>
            <Text style={styles.balanceSubtext}>
              Across all accounts
            </Text>
          </LinearGradient>
        </Surface>

        {/* Accounts grouped by type for organized display */}
        {Object.entries(groupedAccounts).map(([type, typeAccounts]) => {
          if (typeAccounts.length === 0) return null; // Skip empty account types
          
          const typeInfo = sourceTypes[type]; // Get type information
          const totalBalance = typeAccounts.reduce((sum, account) => sum + account.balance, 0); // Calculate total for this type

          return (
            <View key={type} style={styles.typeSection}>
              <View style={styles.typeHeader}>
                <View style={styles.typeInfo}>
                  <View style={[
                    styles.accountIcon,
                    { backgroundColor: (CATEGORY_COLORS[type] || '#94A3B8') + '20' } // Icon background with opacity
                  ]}>
                    {(() => {
                      const Icon = CATEGORY_ICONS[type] || CreditCard; // Get icon for account type
                      return <Icon color={CATEGORY_COLORS[type] || '#94A3B8'} size={20} />;
                    })()}
                  </View>
                  <View>
                    <Text style={styles.typeTitle}>{typeInfo.label}</Text>
                    <Text style={styles.typeCount}>
                      {typeAccounts.length} account{typeAccounts.length !== 1 ? 's' : ''} {/* Pluralize correctly */}
                    </Text>
                  </View>
                </View>
                <Text style={styles.typeBalance}>
                  {formatCurrency(totalBalance)} {/* Display total balance for this type */}
                </Text>
              </View>

              {/* Individual account cards within each type group */}
              {typeAccounts.map((account, index) => (
                <Surface key={account.id || account.name + '-' + index} style={styles.accountCard}>
                  <View style={styles.accountRow}>
                    <View style={styles.accountInfo}>
                      <View style={[
                        styles.accountIcon,
                        { backgroundColor: (CATEGORY_COLORS[account.type] || '#94A3B8') + '20' } // Account-specific icon background
                      ]}>
                        {(() => {
                          const Icon = CATEGORY_ICONS[account.type] || CreditCard; // Get icon for this account
                          return <Icon color={CATEGORY_COLORS[account.type] || '#94A3B8'} size={20} />;
                        })()}
                      </View>
                      <View style={styles.accountDetails}>
                        <Text style={styles.accountName}>{account.name}</Text>
                        <Text style={styles.accountType}>{typeInfo.label}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.accountActions}>
                      <Text style={styles.accountBalance}>
                        {formatCurrency(account.balance)} {/* Display individual account balance */}
                      </Text>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={{ marginLeft: 8, padding: 4 }}
                          onPress={() => openEditModal(account)} // Open edit modal for this account
                        >
                          <Pencil color={theme.colors.textSubtle} size={18} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ marginLeft: 4, padding: 4 }}
                          onPress={() => handleDelete(account)} // Open delete confirmation for this account
                        >
                          <Trash2 color={theme.colors.error} size={18} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Surface>
              ))}
            </View>
          );
        })}

        {/* Empty state when no accounts exist */}
        {accounts.length === 0 && (
          <Surface style={styles.emptyCard}>
            <CreditCard color={theme.colors.textSubtle} size={48} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>No money sources yet</Text>
            <Text style={styles.emptyText}>
              Add your first money source to start tracking your finances
            </Text>
          </Surface>
        )}
      </ScrollView>

      {/* Floating Action Button for adding new accounts */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openAddModal} // Open add account modal
        color="white"
      />

      {/* Add/Edit Account Modal with form */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAccount ? 'Edit Account' : 'Add New Account'} {/* Dynamic title based on mode */}
              </Text>
              <AppButton variant="text" onPress={closeModal}>
                <Text style={{ fontSize: 28, color: '#F9FAFB' }}>{'\u00D7'}</Text>
              </AppButton>
            </View>
            <Surface style={{ borderRadius: 20, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, margin: theme.spacing.lg }}>
              {/* Account Type Selection */}
              <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Account Type</Text>
              <AppDropdown
                items={Object.entries(sourceTypes).map(([key, type]) => ({
                  label: type.label,
                  value: key,
                }))}
                selectedValue={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))} // Update form data
                style={{ marginBottom: theme.spacing.lg }}
              />
              {/* Account Name Input */}
              <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Account Name</Text>
              <AppTextField
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))} // Update form data
                placeholder="e.g., GPay, SBI Bank, Wallet"
                style={{ marginBottom: theme.spacing.lg }}
              />
              {/* Balance Input */}
              <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Balance</Text>
              <AppTextField
                value={formData.balance}
                onChangeText={(text) => setFormData(prev => ({ ...prev, balance: text }))} // Update form data
                keyboardType="numeric"
                placeholder="0.00"
                style={{ marginBottom: theme.spacing.lg }}
              />
              {/* Submit button with dynamic text and loading state */}
              <AppButton
                style={{ marginTop: theme.spacing.lg, alignSelf: 'center', minWidth: 180, ...theme.button.filled, opacity: delayedLoading ? 0.6 : 1 }}
                onPress={handleSubmit}
                disabled={delayedLoading}
                activeOpacity={0.85}
              >
                <Text style={theme.button.filledLabel}>{editingAccount ? (delayedLoading ? 'Saving...' : 'Save Changes') : (delayedLoading ? 'Adding...' : 'Add Account')}</Text>
              </AppButton>
            </Surface>
          </View>
        </View>
      </Modal>
      {/* Success message snackbar */}
      <Snackbar
        visible={showSuccess}
        onDismiss={() => setShowSuccess(false)}
        duration={1800}
        style={{ backgroundColor: theme.colors.accent, marginBottom: 32, marginHorizontal: 16, borderRadius: 12 }}
      >
        <Text style={{ color: '#fff', fontFamily: theme.font.family.medium, textAlign: 'center' }}>{successMsg}</Text>
      </Snackbar>

      {/* Delete confirmation modal with warning */}
      <AppModal
        visible={deleteModalVisible}
        onDismiss={() => {
          setDeleteModalVisible(false);
          setAccountToDelete(null);
        }}
        title="Delete Account"
        type="warning"
        message={
          accountToDelete ? 
          `Are you sure you want to delete "${accountToDelete.name}"?\n\nThis action cannot be undone.` :
          ''
        }
        actions={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setDeleteModalVisible(false);
              setAccountToDelete(null);
            }
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: confirmDelete // Execute deletion
          }
        ]}
        showCloseButton={false}
        blurBackground={true}
      />

      {/* Error modal for displaying validation and operation errors */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#0F172A',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    letterSpacing: -0.3,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  balanceCard: {
    marginBottom: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  balanceGradient: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  balanceSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    letterSpacing: 0.2,
  },
  typeSection: {
    marginBottom: 24,
  },
  typeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  typeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  typeCount: {
    fontSize: 14,
    color: '#94A3B8',
    letterSpacing: 0.2,
  },
  typeBalance: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FAFB',
    letterSpacing: 0.2,
  },
  accountCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  accountIconText: {
    fontSize: 20,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  accountType: {
    fontSize: 14,
    color: '#94A3B8',
    letterSpacing: 0.2,
  },
  accountActions: {
    alignItems: 'flex-end',
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },

  emptyCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    letterSpacing: -0.3,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  inputCard: {
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  balanceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    marginRight: 8,
    letterSpacing: 0.2,
  },
  submitButtonText: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default AccountsScreen; 