import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { Surface, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '../hooks/useStore';
import { generateId, formatCurrency } from '../utils/formatCurrency';
import AppButton from '../components/AppButton';
import AppTextField from '../components/AppTextField';
import AppDropdown from '../components/AppDropdown';
import { ArrowLeft } from 'lucide-react-native';
import theme from '../utils/theme';

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

  useEffect(() => {
    const currentStats = getStats();
    setStats(currentStats);
  }, [accounts]);

  const sourceTypes = {
    upi: { label: 'UPI / Digital Wallet', icon: '💳', color: '#3B82F6' },
    bank: { label: 'Bank Account', icon: '🏦', color: '#8B5CF6' },
    cash: { label: 'Cash', icon: '💵', color: '#10B981' },
    wallet: { label: 'Digital Wallet', icon: '📱', color: '#F59E0B' },
    custom: { label: 'Custom', icon: '🎯', color: '#EF4444' },
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
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }

    if (!formData.balance || parseFloat(formData.balance) < 0) {
      Alert.alert('Error', 'Please enter a valid balance');
      return;
    }

    try {
      const accountData = {
        name: formData.name.trim(),
        type: formData.type,
        icon: sourceTypes[formData.type].icon,
        balance: parseFloat(formData.balance),
      };

      if (editingAccount) {
        await updateAccount(editingAccount.id, accountData);
        Alert.alert('Success', 'Account updated successfully');
      } else {
        await addAccount({
          id: generateId(),
          ...accountData,
        });
        Alert.alert('Success', 'Account added successfully');
      }

      closeModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to save account. Please try again.');
    }
  };

  const handleDelete = (account) => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${account.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount(account.id);
              Alert.alert('Success', 'Account deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getAccountsByType = () => {
    const grouped = {};
    Object.keys(sourceTypes).forEach(type => {
      grouped[type] = accounts.filter(account => account.type === type);
    });
    return grouped;
  };

  const groupedAccounts = getAccountsByType();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <AppButton
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color="#F9FAFB" />
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
        <Surface style={styles.balanceCard}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.1)', 'rgba(37, 99, 235, 0.05)']}
            style={styles.balanceGradient}
          >
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(stats.totalBalance)}
            </Text>
            <Text style={styles.balanceSubtext}>
              Across {accounts.length} source{accounts.length !== 1 ? 's' : ''}
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
                  <Text style={styles.typeIcon}>{typeInfo.icon}</Text>
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
                        { backgroundColor: typeInfo.color + '20' }
                      ]}>
                        <Text style={styles.accountIconText}>{account.icon}</Text>
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
                        <AppButton
                          style={styles.editButton}
                          onPress={() => openEditModal(account)}
                        >
                          <Text style={styles.editButtonText}>✏️</Text>
                        </AppButton>
                        <AppButton
                          style={styles.deleteButton}
                          onPress={() => handleDelete(account)}
                        >
                          <Text style={styles.deleteButtonText}>🗑️</Text>
                        </AppButton>
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
            <Text style={styles.emptyIcon}>💳</Text>
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
                <Text style={{fontSize:28}}>&times;</Text>
              </AppButton>
            </View>
            <Surface style={{ borderRadius: 20, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, margin: theme.spacing.lg }}>
              {/* Account Type */}
              <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Account Type</Text>
              <AppDropdown
                items={Object.entries(sourceTypes).map(([key, type]) => ({
                  label: `${type.icon} ${type.label}`,
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
              <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Current Balance (₹)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.lg }}>
                <Text style={styles.currencySymbol}>₹</Text>
                <AppTextField
                  value={formData.balance}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, balance: text }))}
                  keyboardType="numeric"
                  placeholder="0.00"
                  style={{ flex: 1 }}
                />
              </View>
              {/* Submit Button */}
              <AppButton
                variant="filled"
                style={{ marginTop: theme.spacing.lg, alignSelf: 'center', minWidth: 180 }}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {editingAccount ? 'Update Account' : 'Add Account'}
                </Text>
              </AppButton>
            </Surface>
          </View>
        </View>
      </Modal>
    </View>
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
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
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
    marginBottom: 24,
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
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  editButtonText: {
    fontSize: 14,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  deleteButtonText: {
    fontSize: 14,
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