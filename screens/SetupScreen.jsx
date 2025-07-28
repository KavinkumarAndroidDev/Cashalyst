import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
} from 'react-native';
import { TextInput, Surface, Snackbar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import useStore from '../hooks/useStore';
import { generateId } from '../utils/formatCurrency';
import AppButton from '../components/AppButton';
import AppTextField from '../components/AppTextField';
import AppDropdown from '../components/AppDropdown';
import AppModal from '../components/AppModal';
import { ArrowLeft, PiggyBank, Coffee, Car, ShoppingCart, Film, Banknote, Calendar, FileText, Book, CreditCard, Wallet, Download, Sparkles, TrendingUp, BarChart2, Plus, ArrowRight, Folder, CheckCircle, Lock, Pencil, Info } from 'lucide-react-native';
import theme from '../utils/theme';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { responsiveFontSize, moderateScale } from '../utils/scale';
import backupService from '../utils/backupService';
import { CommonActions } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const SetupScreen = ({ navigation }) => {
  const { addAccount, loading } = useStore();
  const [sources, setSources] = useState([]);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [sourceForm, setSourceForm] = useState({ type: 'upi', name: '', balance: '' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [delayedLoading, setDelayedLoading] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [restored, setRestored] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  let loadingTimeout = null;
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  // 1. Add state for info and error modals
  const [showSourceInfoModal, setShowSourceInfoModal] = useState(false);
  const [showRestoreInfoModal, setShowRestoreInfoModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [duplicateNameError, setDuplicateNameError] = useState(false);

  const sourceTypes = {
    upi: { label: 'UPI' },
    bank: { label: 'Bank Account' },
    cash: { label: 'Cash' },
    wallet: { label: 'Digital Wallet' },
    custom: { label: 'Custom' },
  };

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

  const updateSource = (id, field, value, iconOverride) => {
    setSources(prev => prev.map(source =>
      source.id === id
        ? { ...source, [field]: value, ...(iconOverride ? { icon: iconOverride } : {}) }
        : source
    ));
  };

  const addNewSource = () => {
    if (sources.some(s => !s.name.trim())) return;
    setSources(prev => [...prev, {
      id: generateId(),
      name: '',
      type: 'upi',
      balance: '',
    }]);
  };

  const removeSource = (id) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  const handleStartTracking = async () => {
    if (!canStartTracking()) return;
    
    setDelayedLoading(false);
    loadingTimeout = setTimeout(() => setDelayedLoading(true), 300);
    
    try {
      // Save username
      await AsyncStorage.setItem('username', username.trim());
      
      // Add all sources as accounts
      for (const source of sources) {
        if (source.name.trim() && source.balance) {
        await addAccount({
          id: generateId(),
          name: source.name.trim(),
          type: source.type,
            balance: parseFloat(source.balance),
          });
        }
      }
      
      // Mark setup as complete
      await AsyncStorage.setItem('setup_complete', 'true');
      // Inform parent (App.js) through a global event
      if (onSetupComplete) onSetupComplete();
      
      setSuccessMsg('Setup completed successfully!');
      setShowSuccess(true);
      
      setTimeout(async () => {
        await AsyncStorage.setItem('setup_complete', 'true');
        // Inform parent (App.js) through a global event
        if (onSetupComplete) onSetupComplete();
        
      }, 1500);
      
    } catch (error) {
      console.error('Setup error:', error);
      if (!showErrorModal && !duplicateNameError) {
        setErrorMessage('Failed to complete setup. Please try again.');
        setShowErrorModal(true);
      }
    } finally {
      clearTimeout(loadingTimeout);
      setDelayedLoading(false);
    }
  };

  const getTotalBalance = () => {
    return sources.reduce((sum, s) => sum + (parseFloat(s.balance) || 0), 0);
  };

  const canStartTracking = () => {
    const hasValidSources = sources.some(s => s.name.trim() && s.balance && parseFloat(s.balance) > 0);
    const hasValidUsername = username.trim().length > 0;
    return hasValidSources && hasValidUsername;
  };

  const checkForBackup = async () => {
    try {
      const hasBackupData = await backupService.hasBackup();
      setHasBackup(hasBackupData);
    } catch (error) {
      console.error('Failed to check backup:', error);
    }
  };

  const handleSetupComplete = async () => {
    if (!canStartTracking()) return;
    
    setDelayedLoading(false);
    loadingTimeout = setTimeout(() => setDelayedLoading(true), 300);
    
    try {
      await AsyncStorage.setItem('username', username.trim());
      await AsyncStorage.setItem('setup_complete', 'true');
      // Inform parent (App.js) through a global event
      if (onSetupComplete) onSetupComplete();
      
      for (const source of sources) {
        if (source.name.trim() && source.balance) {
          await addAccount({
            id: generateId(),
            name: source.name.trim(),
            type: source.type,
            balance: parseFloat(source.balance),
          });
        }
      }
      
      setSuccessMsg('Setup completed successfully!');
      setShowSuccess(true);
      
      setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }]
          })
        );
      }, 1500);
      
    } catch (error) {
      console.error('Setup error:', error);
      if (!showErrorModal && !duplicateNameError) {
        setErrorMessage('Failed to complete setup. Please try again.');
        setShowErrorModal(true);
      }
    } finally {
      clearTimeout(loadingTimeout);
      setDelayedLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    setRestoreLoading(true);
    try {
      await backupService.restoreBackup();
      setRestored(true);
      setSuccessMsg('Data restored successfully!');
      setShowSuccess(true);
      
      setTimeout(async () => {
        await AsyncStorage.setItem('setup_complete', 'true');
        // Inform parent (App.js) through a global event
        if (onSetupComplete) onSetupComplete();
        
      }, 1500);
      
    } catch (error) {
      console.error('Restore error:', error);
      setErrorMessage('Failed to restore data. Please try again.');
      setShowErrorModal(true);
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleRestoreFromInternal = async () => {
    setRestoreLoading(true);
    try {
      await backupService.restoreFromInternalBackup();
      setRestored(true);
      setSuccessMsg('Data restored successfully!');
      setShowSuccess(true);
      
      setTimeout(async () => {
        await AsyncStorage.setItem('setup_complete', 'true');
        // Inform parent (App.js) through a global event
        if (onSetupComplete) onSetupComplete();
        
      }, 1500);
      
    } catch (error) {
      console.error('Restore error:', error);
      setErrorMessage('Failed to restore data. Please try again.');
      setShowErrorModal(true);
    } finally {
      setRestoreLoading(false);
    }
  };

  const openSourceModal = (source = null) => {
    if (source) {
      setSourceForm({
        type: source.type,
        name: source.name,
        balance: source.balance.toString(),
      });
      setEditingSource(source);
    } else {
      setSourceForm({ type: 'upi', name: '', balance: '' });
      setEditingSource(null);
    }
    setShowSourceModal(true);
  };

  const saveSource = () => {
    try {
      const trimmedName = sourceForm.name.trim();
      if (!trimmedName) {
        setErrorMessage('Please enter a source name');
        setShowErrorModal(true);
        setDuplicateNameError(false);
        return;
      }
      if (!sourceForm.balance || parseFloat(sourceForm.balance) < 0) {
        setErrorMessage('Please enter a valid balance');
        setShowErrorModal(true);
        setDuplicateNameError(false);
        return;
      }
      // Check for duplicate names (case-insensitive, trimmed)
      const duplicate = sources.some(s => s.name.trim().toLowerCase() === trimmedName.toLowerCase() && (!editingSource || s.id !== editingSource.id));
      if (duplicate) {
        setErrorMessage('A money source with this name already exists. Please use a different name.');
        setShowErrorModal(true);
        setDuplicateNameError(true);
      return;
    }
    if (editingSource) {
        updateSource(editingSource.id, 'name', trimmedName);
        updateSource(editingSource.id, 'type', sourceForm.type);
        updateSource(editingSource.id, 'balance', sourceForm.balance);
    } else {
        setSources(prev => [...prev, {
          id: generateId(),
          name: trimmedName,
          type: sourceForm.type,
          balance: sourceForm.balance,
        }]);
    }
    setShowSourceModal(false);
    } catch (error) {
      if (!showErrorModal && !duplicateNameError) {
        setErrorMessage(error.message || 'Failed to save source. Please try again.');
        setShowErrorModal(true);
      }
    }
  };

  const deleteSource = (id) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  useEffect(() => {
    checkForBackup();
    addNewSource(); // Start with one empty source
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 160, backgroundColor: theme.colors.background }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Header */}
        <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 20 }}>
          <Text style={{ fontFamily: theme.font.family.bold, fontSize: 24, color: theme.colors.textMain, marginBottom: 8, textAlign: 'center' }}>
            Welcome to Cashalyst
          </Text>
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: 16, color: theme.colors.textSubtle, textAlign: 'center', lineHeight: 22 }}>
            Let's set up your financial tracking in just a few steps
          </Text>
          </View>

        {/* Step 1: Your Name */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontFamily: theme.font.family.bold, fontSize: 18, color: theme.colors.textMain, marginBottom: 12 }}>
            What should we call you?
          </Text>
          <AppTextField
            value={username}
            onChangeText={text => {
              setUsername(text);
              if (text.trim().length > 0) setUsernameError('');
            }}
            placeholder="Enter your name"
            style={{ backgroundColor: theme.colors.card, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border }}
            autoCapitalize="words"
            maxLength={24}
          />
          {usernameError ? <Text style={{ color: theme.colors.error, fontSize: 13, marginTop: 4 }}>{usernameError}</Text> : null}
        </View>

        {/* Step 2: Money Sources */}
        <View style={{ marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontFamily: theme.font.family.bold, fontSize: 18, color: theme.colors.textMain, marginRight: 6 }}>
              Add your money sources
            </Text>
            <TouchableOpacity onPress={() => setShowSourceInfoModal(true)}>
            <Info color={theme.colors.accent} size={18} />
          </TouchableOpacity>
        </View>
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: 14, color: theme.colors.textSubtle, marginBottom: 16, lineHeight: 20 }}>
            Add where you keep your money (bank accounts, wallets, cash, etc.)
                </Text>
          
          {/* Money Sources List */}
          {sources.map((source, index) => (
            <Surface key={source.id} style={{ backgroundColor: theme.colors.card, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: (CATEGORY_COLORS[source.type] || '#94A3B8') + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  {(() => {
                    const Icon = CATEGORY_ICONS[source.type] || CreditCard;
                    return <Icon color={CATEGORY_COLORS[source.type] || '#94A3B8'} size={20} />;
                  })()}
                  </View>
                    <View style={{ flex: 1 }}>
                  <AppTextField
                    value={source.name}
                    onChangeText={(text) => updateSource(source.id, 'name', text)}
                    placeholder="Source name (e.g., SBI Savings)"
                    style={{ backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 0 }}
                  />
                    </View>
                <TouchableOpacity onPress={() => openSourceModal(source)} style={{ padding: 8 }}>
                      <Pencil color={theme.colors.textSubtle} size={18} />
                    </TouchableOpacity>
                {sources.length > 1 && (
                  <TouchableOpacity onPress={() => deleteSource(source.id)} style={{ padding: 8 }}>
                        <Text style={{ color: theme.colors.error, fontSize: 18, fontWeight: 'bold' }}>×</Text>
                      </TouchableOpacity>
                    )}
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppDropdown
                  items={Object.entries(sourceTypes).map(([key, type]) => ({ label: type.label, value: key }))}
                  selectedValue={source.type}
                  onValueChange={(value) => updateSource(source.id, 'type', value)}
                  style={{ flex: 1, marginRight: 12 }}
                />
                <AppTextField
                  value={source.balance}
                  onChangeText={(text) => updateSource(source.id, 'balance', text)}
                  placeholder="0.00"
                  keyboardType="numeric"
                  style={{ flex: 1, backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 0 }}
                />
              </View>
                  </Surface>
                ))}
        
          {/* Add Source Button */}
        <AppButton
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 1, borderColor: theme.colors.accent, borderRadius: 12, paddingVertical: 12 }}
            onPress={addNewSource}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Plus color={theme.colors.accent} size={18} style={{ marginRight: 8 }} />
              <Text style={{ color: theme.colors.accent, fontFamily: theme.font.family.bold, fontSize: 14 }}>
                Add Another Source
              </Text>
          </View>
        </AppButton>
        </View>

        {/* Total Balance Preview */}
        {sources.some(s => s.balance && parseFloat(s.balance) > 0) && (
          <Surface style={{ backgroundColor: theme.colors.card, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 20, marginBottom: 32 }}>
            <Text style={{ fontFamily: theme.font.family.medium, fontSize: 14, color: theme.colors.textSubtle, marginBottom: 4 }}>
              Total Balance
          </Text>
            <Text style={{ fontFamily: theme.font.family.bold, fontSize: 24, color: theme.colors.textMain }}>
              ₹{getTotalBalance().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </Surface>
        )}

        {/* Start Tracking Button */}
          <AppButton
          style={{ 
            backgroundColor: canStartTracking() ? theme.colors.accent : 'rgba(148, 163, 184, 0.2)', 
            paddingVertical: 16, 
            borderRadius: 12,
            opacity: delayedLoading ? 0.7 : 1
          }}
          onPress={handleStartTracking}
          disabled={!canStartTracking() || delayedLoading}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: canStartTracking() ? '#fff' : theme.colors.textSubtle, fontFamily: theme.font.family.bold, fontSize: 16, marginRight: 8 }}>
              {delayedLoading ? 'Setting up...' : 'Start Tracking'}
            </Text>
            <ArrowRight color={canStartTracking() ? '#fff' : theme.colors.textSubtle} size={20} />
        </View>
        </AppButton>

        {/* Add Restore from Backup button at the bottom */}
        <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Lock color={theme.colors.textSubtle} size={16} style={{ marginRight: 6 }} />
            <Text style={{ fontFamily: theme.font.family.medium, fontSize: 12, color: theme.colors.textSubtle }}>
              Your data is private and stored only on your device
          </Text>
          </View>
          <AppButton
            style={{ marginTop: 12, backgroundColor: 'rgba(59, 130, 246, 0.08)', borderWidth: 1, borderColor: theme.colors.accent, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 }}
            textStyle={{ color: theme.colors.accent, fontFamily: theme.font.family.bold, fontSize: 15 }}
            onPress={() => navigation.navigate('RestoreScreen')}
          >
            <Text style={{ color: theme.colors.accent, fontFamily: theme.font.family.bold, fontSize: 15 }}>Restore from Backup</Text>
          </AppButton>
        </View>
      </ScrollView>

      {/* Add/Edit Source Modal */}
      <Modal
        visible={showSourceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSourceModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '90%', backgroundColor: theme.colors.card, borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontFamily: theme.font.family.bold, color: theme.colors.textMain }}>
                {editingSource ? 'Edit Source' : 'Add Source'}
              </Text>
              <TouchableOpacity onPress={() => setShowSourceModal(false)}>
                <Text style={{ fontSize: 24, color: theme.colors.textSubtle }}>×</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={{ fontFamily: theme.font.family.medium, fontSize: 14, color: theme.colors.textSubtle, marginBottom: 8 }}>Type</Text>
            <AppDropdown
              items={Object.entries(sourceTypes).map(([key, type]) => ({ label: type.label, value: key }))}
              selectedValue={sourceForm.type}
              onValueChange={value => setSourceForm(f => ({ ...f, type: value }))}
              style={{ marginBottom: 16 }}
            />
            
            <Text style={{ fontFamily: theme.font.family.medium, fontSize: 14, color: theme.colors.textSubtle, marginBottom: 8 }}>Name</Text>
            <AppTextField
              value={sourceForm.name}
              onChangeText={text => setSourceForm(f => ({ ...f, name: text }))}
              placeholder="e.g., SBI Savings, Paytm, Cash"
              style={{ marginBottom: 16 }}
            />
            
            <Text style={{ fontFamily: theme.font.family.medium, fontSize: 14, color: theme.colors.textSubtle, marginBottom: 8 }}>Balance</Text>
            <AppTextField
              value={sourceForm.balance}
              onChangeText={text => setSourceForm(f => ({ ...f, balance: text }))}
              placeholder="0.00"
              keyboardType="numeric"
              style={{ marginBottom: 24 }}
            />
            
          <AppButton
              style={{ backgroundColor: theme.colors.accent, paddingVertical: 12, borderRadius: 8 }}
              onPress={saveSource}
            >
              <Text style={{ color: '#fff', fontFamily: theme.font.family.bold, fontSize: 14 }}>
                {editingSource ? 'Save Changes' : 'Add Source'}
            </Text>
            </AppButton>
        </View>
        </View>
      </Modal>

      {/* Restore Modal */}
      <AppModal
        visible={showRestoreModal}
        onDismiss={() => setShowRestoreModal(false)}
        title="Restore Your Data"
        type="info"
        message="Choose how you'd like to restore your previous data:"
        actions={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setShowRestoreModal(false)
          },
          {
            text: 'Restore from File',
            style: 'primary',
            onPress: handleRestoreBackup
          },
          {
            text: 'Restore from Device',
            style: 'primary',
            onPress: handleRestoreFromInternal,
            disabled: !hasBackup
          }
        ]}
        showCloseButton={false}
        blurBackground={true}
      />

      {/* Info modal for money sources */}
      <AppModal
        visible={showSourceInfoModal}
        onDismiss={() => setShowSourceInfoModal(false)}
        title="What is a money source?"
        message="A money source is where you keep your money, like a bank account, wallet, or cash in hand. Add each source you want to track."
        actions={[
          { text: 'Got it', style: 'primary', onPress: () => setShowSourceInfoModal(false) }
        ]}
        showCloseButton={false}
      />

      {/* Info modal for restore/backup */}
      <AppModal
        visible={showRestoreInfoModal}
        onDismiss={() => setShowRestoreInfoModal(false)}
        title="Restore from Backup"
        message="Restore lets you load your previous data from a backup file. Use this if you are reinstalling the app or switching devices."
        actions={[
          { text: 'Got it', style: 'primary', onPress: () => setShowRestoreInfoModal(false) }
        ]}
        showCloseButton={false}
      />

      <Snackbar
        visible={showSuccess}
        onDismiss={() => setShowSuccess(false)}
        duration={2000}
        style={{ backgroundColor: theme.colors.accent, marginBottom: 32, marginHorizontal: 16, borderRadius: 12 }}
      >
        <Text style={{ color: '#fff', fontFamily: theme.font.family.medium, textAlign: 'center' }}>
          {successMsg}
        </Text>
      </Snackbar>

      {/* Error modal for all errors (including duplicate names) */}
      <AppModal
        visible={showErrorModal}
        onDismiss={() => {
          setShowErrorModal(false);
          setDuplicateNameError(false);
        }}
        title="Error"
        type="error"
        message={errorMessage}
        actions={[
          { text: 'OK', style: 'primary', onPress: () => {
            setShowErrorModal(false);
            setDuplicateNameError(false);
          }}
        ]}
        showCloseButton={false}
        blurBackground={true}
      />
    </SafeAreaView>
  );
};

export default SetupScreen; 