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
  const { accounts, addAccount, updateAccount, deleteAccount, getStats } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'upi',
    balance: '',
  });
  const [stats, setStats] = useState({
    totalBalance: 0,
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [delayedLoading, setDelayedLoading] = useState(false);
  const [balanceAnimation] = useState(new Animated.Value(1));
  const [lastBalance, setLastBalance] = useState(0);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  let loadingTimeout = null;

  useEffect(() => {
    const currentStats = getStats();
    setStats(currentStats);
    
    // Animate balance change if it's different from last time
    if (currentStats.totalBalance !== lastBalance && lastBalance !== 0) {
      Animated.sequence([
        Animated.timing(balanceAnimation, {
          toValue: 1.02,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(balanceAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
    setLastBalance(currentStats.totalBalance);
  }, [accounts]);

  const sourceTypes = {
    upi: { label: 'UPI', color: '#3B82F6' },
    bank: { label: 'Bank Account', color: '#8B5CF6' },
    cash: { label: 'Cash', color: '#10B981' },
    wallet: { label: 'Digital Wallet', color: '#F59E0B' },
    custom: { label: 'Custom', color: '#EF4444' },
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'upi',
      balance: '',
    });
    setEditingAccount(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (account) => {
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
    });
    setEditingAccount(account);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        setErrorMessage('Please enter an account name');
        setErrorModalVisible(true);
        return;
      }
      if (!formData.balance || parseFloat(formData.balance) < 0) {
        setErrorMessage('Please enter a valid balance');
        setErrorModalVisible(true);
        return;
      }
      // Check for duplicate account names (case-insensitive)
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
      setDelayedLoading(false);
      loadingTimeout = setTimeout(() => setDelayedLoading(true), 300);
      const accountData = {
        name: trimmedName,
        type: formData.type,
        balance: parseFloat(formData.balance),
      };
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

  const handleDelete = (account) => {
    setAccountToDelete(account);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    
    try {
      await deleteAccount(accountToDelete.id);
      setSuccessMsg('Account deleted successfully');
      setShowSuccess(true);
    } catch (error) {
      // You can add error modal here if needed
    } finally {
      setDeleteModalVisible(false);
      setAccountToDelete(null);
    }
  };

  const getAccountsByType = () => {
    const grouped = {};
    Object.keys(sourceTypes).forEach(type => {
      grouped[type] = accounts.filter(account => account.type === type);
    });
    return grouped;
  };

  const groupedAccounts = getAccountsByType();

  const CATEGORY_ICONS = {
    upi: CreditCard,
    bank: Banknote,
    cash: PiggyBank,
    wallet: ShoppingCart,
    custom: PiggyBank,
  };
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
      
      {/* Header */}
      <View style={{ paddingTop: 20, paddingBottom: 20, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.background }}>
        <View style={styles.headerContent}>
          <AppButton
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color={theme.colors.textMain} size={22} />
          </AppButton>
          <Text style={styles.headerTitle}>Money Sources</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Balance Card */}
        <Surface style={[styles.balanceCard, { transform: [{ scale: balanceAnimation }] }]}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.1)', 'rgba(37, 99, 235, 0.05)']}
            style={styles.balanceGradient}
          >
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(stats.totalBalance)}
            </Text>
            <Text style={styles.balanceSubtext}>
              Across all accounts
            </Text>
          </LinearGradient>
        </Surface>

        {/* Accounts by Type */}
        {Object.entries(groupedAccounts).map(([type, typeAccounts]) => {
          if (typeAccounts.length === 0) return null;
          
          const typeInfo = sourceTypes[type];
          const totalBalance = typeAccounts.reduce((sum, account) => sum + account.balance, 0);

          return (
            <View key={type} style={styles.typeSection}>
              <View style={styles.typeHeader}>
                <View style={styles.typeInfo}>
                  <View style={[
                    styles.accountIcon,
                    { backgroundColor: (CATEGORY_COLORS[type] || '#94A3B8') + '20' }
                  ]}>
                    {(() => {
                      const Icon = CATEGORY_ICONS[type] || CreditCard;
                      return <Icon color={CATEGORY_COLORS[type] || '#94A3B8'} size={20} />;
                    })()}
                  </View>
                  <View>
                    <Text style={styles.typeTitle}>{typeInfo.label}</Text>
                    <Text style={styles.typeCount}>
                      {typeAccounts.length} account{typeAccounts.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.typeBalance}>
                  {formatCurrency(totalBalance)}
                </Text>
              </View>

              {typeAccounts.map((account, index) => (
                <Surface key={account.id || account.name + '-' + index} style={styles.accountCard}>
                  <View style={styles.accountRow}>
                    <View style={styles.accountInfo}>
                      <View style={[
                        styles.accountIcon,
                        { backgroundColor: (CATEGORY_COLORS[account.type] || '#94A3B8') + '20' }
                      ]}>
                        {(() => {
                          const Icon = CATEGORY_ICONS[account.type] || CreditCard;
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
                        {formatCurrency(account.balance)}
                      </Text>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={{ marginLeft: 8, padding: 4 }}
                          onPress={() => openEditModal(account)}
                        >
                          <Pencil color={theme.colors.textSubtle} size={18} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ marginLeft: 4, padding: 4 }}
                          onPress={() => handleDelete(account)}
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

        {/* Empty State */}
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

      {/* Add Account FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openAddModal}
        color="white"
      />

      {/* Add/Edit Account Modal */}
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
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </Text>
              <AppButton variant="text" onPress={closeModal}>
                <Text style={{ fontSize: 28, color: '#F9FAFB' }}>{'\u00D7'}</Text>
              </AppButton>
            </View>
            <Surface style={{ borderRadius: 20, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, margin: theme.spacing.lg }}>
              {/* Account Type */}
              <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Account Type</Text>
              <AppDropdown
                items={Object.entries(sourceTypes).map(([key, type]) => ({
                  label: type.label,
                  value: key,
                }))}
                selectedValue={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                style={{ marginBottom: theme.spacing.lg }}
              />
              {/* Account Name */}
              <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Account Name</Text>
              <AppTextField
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="e.g., GPay, SBI Bank, Wallet"
                style={{ marginBottom: theme.spacing.lg }}
              />
              {/* Balance */}
              <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Balance</Text>
              <AppTextField
                value={formData.balance}
                onChangeText={(text) => setFormData(prev => ({ ...prev, balance: text }))}
                keyboardType="numeric"
                placeholder="0.00"
                style={{ marginBottom: theme.spacing.lg }}
              />
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
      <Snackbar
        visible={showSuccess}
        onDismiss={() => setShowSuccess(false)}
        duration={1800}
        style={{ backgroundColor: theme.colors.accent, marginBottom: 32, marginHorizontal: 16, borderRadius: 12 }}
      >
        <Text style={{ color: '#fff', fontFamily: theme.font.family.medium, textAlign: 'center' }}>{successMsg}</Text>
      </Snackbar>

      {/* Custom Delete Confirmation Modal */}
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
            onPress: confirmDelete
          }
        ]}
        showCloseButton={false}
        blurBackground={true}
      />

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