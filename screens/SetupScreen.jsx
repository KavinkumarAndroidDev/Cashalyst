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

const { width } = Dimensions.get('window');

const SetupScreen = ({ navigation }) => {
  const { addAccount, loading } = useStore();
  const [sources, setSources] = useState([]);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [editingSource, setEditingSource] = useState(null); // null for add, object for edit
  const [sourceForm, setSourceForm] = useState({ type: 'upi', name: '', balance: '' });
  const [accountsLoaded, setAccountsLoaded] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [delayedLoading, setDelayedLoading] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [restored, setRestored] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  let loadingTimeout = null;
  const [expandedSourceId, setExpandedSourceId] = useState(sources[0]?.id);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showRestoreInfo, setShowRestoreInfo] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const sourceTypes = {
    upi: { label: 'UPI' },
    bank: { label: 'Bank Account' },
    cash: { label: 'Cash' },
    wallet: { label: 'Digital Wallet' },
    custom: { label: 'Custom' },
  };

  const typeIcons = {
    upi: '💳',
    bank: '🏦',
    cash: '💵',
    wallet: '📱',
    custom: '🎯',
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
    if (sources.length > 1) {
      setSources(prev => prev.filter(source => source.id !== id));
    }
  };

  const handleStartTracking = async () => {
    // Validate sources
    const validSources = sources.filter(source => 
      source.name.trim() && source.balance !== ''
    );
    // Prevent duplicate names in the onboarding form
    const names = validSources.map(s => s.name.trim().toLowerCase());
    const hasDuplicates = names.length !== new Set(names).size;
    if (hasDuplicates) {
      Alert.alert('Error', 'Duplicate source names are not allowed.');
      return;
    }
    if (validSources.length === 0) {
      Alert.alert('Error', 'Please enter amount for at least one source');
      return;
    }
    setDelayedLoading(false);
    loadingTimeout = setTimeout(() => setDelayedLoading(true), 300);
    try {
      // Load existing accounts from storage
      const existingAccounts = await require('../db/asyncStorageService').getAccounts();
      const existingNames = new Set(existingAccounts.map(acc => acc.name.trim().toLowerCase()));
      for (const source of validSources) {
        if (existingNames.has(source.name.trim().toLowerCase())) {
          continue; // Already exists, skip
        }
        await addAccount({
          id: generateId(),
          name: source.name.trim(),
          type: source.type,
          icon: source.icon,
          balance: parseFloat(source.balance) || 0,
        });
      }
      // Ensure global state is synced with storage
      if (typeof useStore.getState === 'function' && useStore.getState().loadAccounts) {
        await useStore.getState().loadAccounts();
      }
      setSuccessMsg('Your money sources have been set up successfully.');
      setShowSuccess(true);
      // Mark setup as complete and navigate
      await handleSetupComplete();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to set up your money sources. Please try again.');
    } finally {
      clearTimeout(loadingTimeout);
      setDelayedLoading(false);
    }
  };

  const getTotalBalance = () => {
    return sources.reduce((total, source) => {
      const balance = parseFloat(source.balance) || 0;
      return total + balance;
    }, 0);
  };

  const canStartTracking = () => {
    return restored || sources.some(source => source.name.trim() && source.balance !== '');
  };

  // Check for existing backup on mount
  useEffect(() => {
    checkForBackup();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // On mount, load username if exists
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('username');
      if (saved) setUsername(saved);
    })();
  }, []);

  // When sources change, ensure at least one is expanded
  useEffect(() => {
    if (!sources.some(s => s.id === expandedSourceId)) {
      setExpandedSourceId(sources[0]?.id);
    }
  }, [sources]);

  const checkForBackup = async () => {
    try {
      const backupExists = await backupService.hasBackup();
      setHasBackup(backupExists);
    } catch (error) {
      console.log('Error checking for backup:', error);
    }
  };

  const handleSetupComplete = async () => {
    try {
      if (!username.trim()) {
        setUsernameError('Please enter your name.');
        return;
      }
      await AsyncStorage.setItem('username', username.trim());
      await AsyncStorage.setItem('setup_complete', 'true');
      // Reload the app to show main screen
      if (typeof global !== 'undefined' && global.showMainScreen) {
        global.showMainScreen();
      }
    } catch (error) {
      console.error('Failed to mark setup as complete:', error);
    }
  };

  const handleRestoreBackup = async () => {
    setRestoreLoading(true);
    try {
      const result = await backupService.restoreBackupFromExternalFile();
      setSuccessMsg('Backup restored successfully! Your accounts and transactions have been loaded.');
      setShowSuccess(true);
      
      // Reload accounts from store if available
      if (typeof useStore.getState === 'function' && useStore.getState().loadAccounts) {
        await useStore.getState().loadAccounts();
      }
      
      // Mark setup as complete and navigate
      await handleSetupComplete();
    } catch (error) {
      Alert.alert('Restore Failed', error.message || 'Failed to restore backup. Please try again.');
    } finally {
      setRestoreLoading(false);
      setShowRestoreModal(false);
    }
  };

  const handleRestoreFromInternal = async () => {
    setRestoreLoading(true);
    try {
      const backup = await backupService.restoreBackup();
      setSuccessMsg('Backup restored successfully! Your accounts and transactions have been loaded.');
      setShowSuccess(true);
      
      // Reload accounts from store if available
      if (typeof useStore.getState === 'function' && useStore.getState().loadAccounts) {
        await useStore.getState().loadAccounts();
      }
      
      // Mark setup as complete and navigate
      await handleSetupComplete();
    } catch (error) {
      Alert.alert('Restore Failed', error.message || 'Failed to restore backup. Please try again.');
    } finally {
      setRestoreLoading(false);
      setShowRestoreModal(false);
    }
  };

  // Open modal for add/edit
  const openSourceModal = (source = null) => {
    if (source) {
      setEditingSource(source);
      setSourceForm({ type: source.type, name: source.name, balance: source.balance });
    } else {
      setEditingSource(null);
      setSourceForm({ type: 'upi', name: '', balance: '' });
    }
    setShowSourceModal(true);
  };
  // Save source (add or edit)
  const saveSource = () => {
    if (!sourceForm.name.trim()) {
      Alert.alert('Error', 'Source name is required.');
      return;
    }
    if (editingSource) {
      setSources(prev => prev.map(s => s.id === editingSource.id ? { ...s, ...sourceForm } : s));
    } else {
      setSources(prev => [...prev, { id: generateId(), ...sourceForm }]);
    }
    setShowSourceModal(false);
    setEditingSource(null);
    setSourceForm({ type: 'upi', name: '', balance: '' });
  };
  // Delete source
  const deleteSource = (id) => {
    if (sources.length === 1) return;
    setSources(prev => prev.filter(s => s.id !== id));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 160, backgroundColor: theme.colors.background }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Name Card at the top */}
        {/* Remove the Surface/card for the name field at the top */}
        {/* Place the name field as a simple View with AppTextField, after the welcome/progress checklist and before the money sources section */}
        {/* Welcome and progress checklist below */}
        <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 0, paddingTop: 0 }}>
          <Text style={{ fontFamily: theme.font.family.bold, fontSize: 22, color: theme.colors.accent, marginBottom: 4, textAlign: 'center', letterSpacing: 0.2 }}>Welcome to Cashalyst</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 4 }}>
            <CheckCircle color={sources.length > 0 ? theme.colors.accent : theme.colors.textSubtle} size={18} style={{ marginRight: 6 }} />
            <Text style={{ color: sources.length > 0 ? theme.colors.accent : theme.colors.textSubtle, fontFamily: theme.font.family.medium, fontSize: 14, marginRight: 16 }}>1. Add a money source</Text>
            <CheckCircle color={sources.length > 0 ? theme.colors.textSubtle : '#E5E7EB'} size={18} style={{ marginRight: 6 }} />
            <Text style={{ color: sources.length > 0 ? theme.colors.textSubtle : '#E5E7EB', fontFamily: theme.font.family.medium, fontSize: 14 }}>2. Start tracking</Text>
          </View>
        </View>

        {/* Money Sources Section */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontFamily: theme.font.family.bold, fontSize: 18, color: theme.colors.textMain, marginRight: 6 }}>Your Money Sources</Text>
          <TouchableOpacity onPress={() => setShowInfoModal(true)}>
            <Info color={theme.colors.accent} size={18} />
          </TouchableOpacity>
        </View>
        {/* Info Modal for Money Sources */}
        <AppModal
          visible={showInfoModal}
          onDismiss={() => setShowInfoModal(false)}
          title="What is a money source?"
          message="A money source is where you keep your money, like a bank account, wallet, or cash in hand. Add each source you want to track."
          actions={[
            { text: 'Got it', style: 'primary', onPress: () => setShowInfoModal(false) }
          ]}
          showCloseButton={false}
        />
        {/* Group sources by type for display */}
        {(() => {
          // Only show sources with a name or a balance
          const filteredSources = sources.filter(s => s.name.trim() || s.balance);
          const grouped = {};
          Object.keys(sourceTypes).forEach(type => {
            grouped[type] = filteredSources.filter(source => source.type === type);
          });
          const hasSources = filteredSources.length > 0;
          if (!hasSources) {
            return (
              <View style={{ alignItems: 'center', marginVertical: 32 }}>
                <CreditCard color={theme.colors.textSubtle} size={48} style={{ marginBottom: 16 }} />
                <Text style={{ fontFamily: theme.font.family.bold, fontSize: 16, color: theme.colors.textSubtle, marginBottom: 4 }}>No money sources yet</Text>
                <Text style={{ fontFamily: theme.font.family.medium, fontSize: 14, color: theme.colors.textSubtle, textAlign: 'center' }}>
                  Add your first money source to start tracking your finances
                </Text>
              </View>
            );
          }
          return Object.entries(grouped).map(([type, typeSources]) => {
            if (typeSources.length === 0) return null;
            const typeInfo = sourceTypes[type];
            const totalBalance = typeSources.reduce((sum, s) => sum + (parseFloat(s.balance) || 0), 0);
            const Icon = CATEGORY_ICONS[type] || CreditCard;
            return (
              <View key={type} style={{ marginBottom: 32 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: (CATEGORY_COLORS[type] || '#94A3B8') + '20', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Icon color={CATEGORY_COLORS[type] || '#94A3B8'} size={20} />
                  </View>
                  <View>
                    <Text style={{ fontFamily: theme.font.family.bold, fontSize: 15, color: theme.colors.textMain }}>{typeInfo.label}</Text>
                    <Text style={{ fontFamily: theme.font.family.medium, fontSize: 12, color: theme.colors.textSubtle }}>{typeSources.length} source{typeSources.length !== 1 ? 's' : ''}</Text>
                  </View>
                  <Text style={{ marginLeft: 'auto', fontFamily: theme.font.family.bold, fontSize: 15, color: theme.colors.accent }}>{'₹' + totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                </View>
                {typeSources.map((source, idx) => (
                  <Surface key={source.id || source.name + '-' + idx} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card, borderRadius: 20, paddingVertical: 18, paddingHorizontal: 24, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border, shadowColor: theme.colors.shadow, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1, width: '100%', alignSelf: 'stretch', minWidth: 0 }}>
                    <Icon color={CATEGORY_COLORS[type] || theme.colors.textSubtle} size={22} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: theme.font.family.bold, fontSize: 15, color: theme.colors.textMain }}>{source.name || 'Unnamed'}</Text>
                      <Text style={{ fontFamily: theme.font.family.medium, fontSize: 12, color: theme.colors.textSubtle }}>{typeInfo.label}</Text>
                    </View>
                    <Text style={{ fontFamily: theme.font.family.bold, fontSize: 15, color: theme.colors.accent, marginRight: 10 }}>{'₹' + (source.balance || '0.00')}</Text>
                    <TouchableOpacity onPress={() => openSourceModal(source)} style={{ paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Pencil color={theme.colors.textSubtle} size={18} />
                    </TouchableOpacity>
                    {filteredSources.length > 1 && (
                      <TouchableOpacity onPress={() => deleteSource(source.id)} style={{ paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ color: theme.colors.error, fontSize: 18, fontWeight: 'bold' }}>×</Text>
                      </TouchableOpacity>
                    )}
                  </Surface>
                ))}
              </View>
            );
          });
        })()}
        
        <AppButton
          variant="filled"
          style={{ marginTop: 8, marginBottom: 36, alignSelf: 'center', minWidth: 180, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: theme.colors.accent, borderWidth: 1, borderRadius: theme.radii.button }}
          onPress={() => openSourceModal()}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Plus color={theme.colors.textMain} size={18} style={{ marginRight: 8 }} />
            <Text style={{ color: theme.colors.buttonText || theme.colors.textMain, fontFamily: theme.font.family.bold, fontSize: theme.font.size.label, textAlign: 'center' }}>Add Source</Text>
          </View>
        </AppButton>
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontFamily: theme.font.family.bold, fontSize: 18, color: theme.colors.textMain, marginRight: 6, marginBottom:12}}>What should we call you?</Text>
          <AppTextField
            value={username}
            onChangeText={text => {
              setUsername(text);
              if (text.trim().length > 0) setUsernameError('');
            }}
            placeholder="Enter your name"
            style={{ backgroundColor: theme.colors.inputBackground || theme.colors.card, borderRadius: theme.radii.button, paddingHorizontal: theme.spacing.md, paddingVertical: 8, width: '100%' }}
            inputStyle={{ color: theme.colors.textMain, fontFamily: theme.font.family.medium, fontSize: theme.font.size.label }}
            autoCapitalize="words"
            maxLength={24}
          />
          {usernameError ? <Text style={{ color: theme.colors.error, fontSize: 13, marginTop: 2 }}>{usernameError}</Text> : null}
        </View>

        {/* Restore from Backup Section (modern vertical card) */}
        <View style={{ backgroundColor: 'rgba(59,130,246,0.06)', borderRadius: 24, paddingVertical: 32, paddingHorizontal: 20, marginBottom: 48, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', shadowColor: theme.colors.shadow, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Text style={{ fontFamily: theme.font.family.bold, fontSize: 17, color: theme.colors.textMain, marginRight: 6, textAlign: 'center' }}>Restore from Backup</Text>
            <TouchableOpacity onPress={() => setShowRestoreInfo(true)}>
              <Info color={theme.colors.accent} size={18} />
            </TouchableOpacity>
          </View>
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: 13, color: theme.colors.textSubtle, textAlign: 'center', marginBottom: 18, marginHorizontal: 8 }}>
            Restore your previous data from a backup file.
          </Text>
          <AppButton
            variant="filled"
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', minWidth: 180, marginTop: 4, borderRadius: theme.radii.button }}
            onPress={() => setShowRestoreModal(true)}
          >
            <Download color={theme.colors.buttonText || theme.colors.textMain} size={16} style={{ marginRight: 6 }} />
            <Text style={{ color: theme.colors.buttonText || theme.colors.textMain, fontFamily: theme.font.family.bold, fontSize: 15 }}>Restore</Text>
          </AppButton>
        </View>
        <AppModal
          visible={showRestoreInfo}
          onDismiss={() => setShowRestoreInfo(false)}
          title="Restore from Backup"
          message="Restore lets you load your previous data from a backup file. Use this if you are reinstalling the app or switching devices."
          actions={[
            { text: 'Got it', style: 'primary', onPress: () => setShowRestoreInfo(false) }
          ]}
          showCloseButton={false}
        />

        {/* Privacy Notice Card */}
        <View style={{ backgroundColor: theme.colors.card, borderRadius: theme.radii.card, paddingVertical: 20, paddingHorizontal: theme.spacing.md, marginTop: 48, borderWidth: 1, borderColor: 'rgba(229, 231, 235, 0.2)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Lock color={theme.colors.textSubtle} size={16} style={{ marginRight: 6 }} />
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.note, color: theme.colors.textSubtle, textAlign: 'center', letterSpacing: 0.2 }}>
            Your data is private and stored only on your device.
          </Text>
        </View>
      </ScrollView>

      {/* Add/Edit Source Modal */}
      <Modal
        visible={showSourceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSourceModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '92%', backgroundColor: theme.colors.card, borderRadius: theme.radii.card, padding: theme.spacing.lg, shadowColor: theme.colors.shadow, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
              <Text style={{ fontSize: theme.font.size.label, fontFamily: theme.font.family.bold, color: theme.colors.textMain, textAlign: 'center' }}>{editingSource ? 'Edit Source' : 'Add Source'}</Text>
              <AppButton variant="text" onPress={() => setShowSourceModal(false)}>
                <Text style={{ fontSize: 28, color: theme.colors.textSubtle }}>{'\u00D7'}</Text>
              </AppButton>
            </View>
            {/* Type Dropdown */}
            <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Type</Text>
            <AppDropdown
              items={Object.entries(sourceTypes).map(([key, type]) => ({ label: type.label, value: key }))}
              selectedValue={sourceForm.type}
              onValueChange={value => setSourceForm(f => ({ ...f, type: value }))}
              style={{ marginBottom: theme.spacing.lg }}
            />
            {/* Name Field */}
            <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Source Name</Text>
            <AppTextField
              value={sourceForm.name}
              onChangeText={text => setSourceForm(f => ({ ...f, name: text }))}
              placeholder="e.g., SBI Savings, Paytm, Cash in Hand"
              style={{ marginBottom: theme.spacing.lg }}
            />
            {/* Balance Field */}
            <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Current Balance</Text>
            <AppTextField
              value={sourceForm.balance}
              onChangeText={text => setSourceForm(f => ({ ...f, balance: text }))}
              keyboardType="numeric"
              placeholder="0.00"
              style={{ marginBottom: theme.spacing.lg }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.md }}>
              <AppButton variant="outlined" style={{ flex: 1, marginRight: theme.spacing.xs }} onPress={() => setShowSourceModal(false)}>
                <Text style={{ color: theme.colors.buttonText || theme.colors.textMain, fontFamily: theme.font.family.bold, fontSize: theme.font.size.label, textAlign: 'center' }}>Cancel</Text>
              </AppButton>
              <AppButton variant="filled" style={{ flex: 1, marginLeft: theme.spacing.xs }} onPress={saveSource}>
                <Text style={{ color: theme.colors.buttonText || theme.colors.textMain, fontFamily: theme.font.family.bold, fontSize: theme.font.size.label, textAlign: 'center' }}>{editingSource ? 'Save' : 'Add'}</Text>
              </AppButton>
            </View>
          </View>
        </View>
      </Modal>

      {/* Snackbar Feedback */}
      <Snackbar
        visible={showSuccess}
        onDismiss={() => setShowSuccess(false)}
        duration={3000}
        style={{ backgroundColor: '#10B981', marginBottom: 32, marginHorizontal: 16, borderRadius: 12 }}
      >
        <Text style={{ color: '#fff', fontFamily: theme.font.family.medium, textAlign: 'center' }}>{successMsg}</Text>
      </Snackbar>
      {/* Error Snackbar (if you use setShowError/setErrorMsg in logic) */}
      {/* The original code did not have showError or errorMsg, so this block is commented out. */}
      {/* If you need to add error handling, you would define showError and errorMsg here. */}
      {/* For now, the Snackbar for success is sufficient. */}

      {/* Sticky Footer Start Tracking Button */}
      <SafeAreaView style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', zIndex: 20, backgroundColor: theme.colors.background }} edges={['bottom']}>
        <View style={{ width: '92%', marginBottom: theme.spacing.lg, borderRadius: 32, shadowColor: theme.colors.shadow, shadowOpacity: 0.18, shadowRadius: 12, elevation: 8 }}>
          <AppButton
            variant="filled"
            style={{ borderRadius: 32, height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.accent, opacity: sources.length === 0 ? 0.7 : 1 }}
            onPress={handleStartTracking}
            disabled={sources.length === 0}
            activeOpacity={sources.length > 0 ? 0.85 : 1}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: theme.colors.buttonText || theme.colors.textMain, fontFamily: theme.font.family.bold, fontSize: theme.font.size.label, textAlign: 'center' }}>Start Tracking</Text>
              <ArrowRight color={theme.colors.buttonText || theme.colors.textMain} size={20} style={{ marginLeft: 8 }} />
            </View>
          </AppButton>
          {sources.length === 0 && (
            <Text style={{ color: theme.colors.textSubtle, fontFamily: theme.font.family.medium, fontSize: 13, textAlign: 'center', marginTop: 6 }}>
              Add a money source to continue.
            </Text>
          )}
        </View>
      </SafeAreaView>

      {/* Restore Modal (unchanged) */}
      <AppModal
        visible={showRestoreModal}
        onDismiss={() => setShowRestoreModal(false)}
        title="Restore Backup"
        message="This will replace your current data with the backup. Are you sure you want to continue?"
        type="warning"
        actions={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setShowRestoreModal(false)
          },
          {
            text: 'Restore',
            style: 'primary',
            onPress: async () => {
              await handleRestoreBackup();
              setRestored(true);
            }
          }
        ]}
        showCloseButton={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerSection: {
    alignItems: 'flex-center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: moderateScale(36),
    paddingBottom: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.font.size.section,
    fontFamily: theme.font.family.bold,
    color: theme.colors.accent,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: theme.font.size.label,
    color: theme.colors.textSubtle,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  sourcesSection: {
    marginBottom: theme.spacing.lg,
  },
  sourceCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sourceDetails: {
    flex: 1,
  },
  sourceName: {
    fontSize: theme.font.size.label,
    fontWeight: '600',
    color: theme.colors.textMain,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  sourceType: {
    fontSize: theme.font.size.note,
    color: theme.colors.textSubtle,
    letterSpacing: 0.2,
  },
  currencySymbol: {
    fontSize: theme.font.size.label,
    fontWeight: '600',
    color: theme.colors.textMain,
    marginRight: 4,
    letterSpacing: 0.2,
  },
  removeButton: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: theme.radii.button,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  removeButtonText: {
    color: theme.colors.error,
    fontSize: theme.font.size.label,
    fontWeight: 'bold',
  },
  restoreSection: {
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  setupSection: {
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.font.size.label,
    fontFamily: theme.font.family.bold,
    color: theme.colors.textMain,
    marginLeft: theme.spacing.sm,
  },
  sectionDescription: {
    fontSize: theme.font.size.note,
    color: theme.colors.textSubtle,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  restoreButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.button,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    marginHorizontal: theme.spacing.xs,
  },
  restoreButtonText: {
    color: theme.colors.accent,
    fontSize: theme.font.size.label,
    fontFamily: theme.font.family.medium,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: theme.spacing.sm,
    color: theme.colors.textSubtle,
    fontSize: theme.font.size.note,
    fontFamily: theme.font.family.medium,
  },
  addSourceButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    alignSelf: 'center',
    minWidth: 180,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: theme.colors.accent,
    borderWidth: 1,
    borderRadius: theme.radii.button,
  },
  addMoreText: {
    color: theme.colors.accent,
    fontSize: theme.font.size.label,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.2)', // A subtle border for privacy notice
  },
  privacyIcon: {
    fontSize: theme.font.size.label,
    marginRight: theme.spacing.sm,
  },
  privacyText: {
    fontSize: theme.font.size.note,
    color: theme.colors.textSubtle,
    textAlign: 'center',
    letterSpacing: 0.2,
    fontFamily: theme.font.family.medium,
  },
  startTrackingContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.card,
  },
  startTrackingButton: {
    borderRadius: theme.radii.button,
    height: moderateScale(52),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  startTrackingText: {
    color: theme.colors.textMain,
    fontFamily: theme.font.family.bold,
    fontSize: theme.font.size.label,
  },
  label: {
    fontFamily: theme.font.family.medium,
    fontSize: theme.font.size.label,
    color: theme.colors.textSubtle,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    textAlign: 'left',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  typeCard: {
    height: 80,
    borderRadius: theme.radii.button,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  typeCardSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
    shadowColor: theme.colors.accent,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  typeCardIcon: {
    fontSize: 28,
    marginBottom: 6,
    color: theme.colors.textSubtle,
  },
  typeCardIconSelected: {
    color: '#fff',
  },
  typeCardLabel: {
    fontSize: 11,
    fontFamily: theme.font.family.medium,
    color: theme.colors.textSubtle,
    textAlign: 'center',
    lineHeight: 14,
  },
  typeCardLabelSelected: {
    color: '#fff',
    fontFamily: theme.font.family.bold,
  },
  checkmarkCircle: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.accent,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  checkmark: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: -1,
  },
  optionsRow: {
    marginBottom: theme.spacing.lg,
  },
  mainActionButton: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
    borderWidth: 1,
  },
  secondaryActionButton: {
    marginBottom: theme.spacing.md,
    borderColor: theme.colors.accent,
    borderWidth: 1,
  },
  restoreDescription: {
    fontSize: theme.font.size.note,
    color: theme.colors.textSubtle,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  restoreLink: {
    marginTop: theme.spacing.xs,
  },
  restoreLinkText: {
    color: theme.colors.accent,
    fontSize: theme.font.size.note,
    fontFamily: theme.font.family.medium,
  },
  bigHeadline: {
    fontSize: theme.font.size.section,
    fontFamily: theme.font.family.bold,
    color: theme.colors.accent,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subHeadline: {
    fontSize: theme.font.size.label,
    color: theme.colors.textSubtle,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  onboardingCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  cardHeadline: {
    fontSize: theme.font.size.section,
    fontFamily: theme.font.family.bold,
    color: theme.colors.textMain,
    marginLeft: theme.spacing.sm,
  },
  cardSubtext: {
    fontSize: theme.font.size.label,
    color: theme.colors.textSubtle,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  restoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  restoreChipText: {
    color: theme.colors.accent,
    fontSize: theme.font.size.note,
    fontFamily: theme.font.family.medium,
  },
  restoreBelowCard: {
    alignSelf: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  restoreBelowCardText: {
    fontSize: theme.font.size.note,
    color: theme.colors.textSubtle,
    textAlign: 'center',
    fontFamily: theme.font.family.medium,
  },
  section: {
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  sectionIcon: {
    fontSize: theme.font.size.section,
    marginBottom: theme.spacing.xs,
  },
  actionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  actionTitle: {
    fontSize: theme.font.size.label,
    fontFamily: theme.font.family.bold,
    color: theme.colors.textMain,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: theme.font.size.note,
    color: theme.colors.textSubtle,
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    borderRadius: theme.radii.button,
    height: moderateScale(48),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  actionButtonText: {
    color: theme.colors.textMain,
    fontFamily: theme.font.family.bold,
    fontSize: theme.font.size.label,
  },
  privacySection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.2)',
    alignItems: 'center',
  },
  privacyTitle: {
    fontSize: theme.font.size.label,
    fontFamily: theme.font.family.bold,
    color: theme.colors.textMain,
    marginRight: theme.spacing.sm,
  },
  headerIcon: {
    fontSize: theme.font.size.section,
    marginRight: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: theme.font.size.label,
    fontFamily: theme.font.family.bold,
    color: theme.colors.textMain,
    marginBottom: theme.spacing.xs,
  },
  cardDescription: {
    fontSize: theme.font.size.note,
    color: theme.colors.textSubtle,
    marginBottom: theme.spacing.md,
  },
  privacyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.2)',
  },
  fixedButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.card,
    zIndex: 10,
    height: 80, // explicit height for button area
    justifyContent: 'center',
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: theme.colors.buttonText || theme.colors.textMain,
    fontFamily: theme.font.family.bold,
    fontSize: theme.font.size.label,
    textAlign: 'center',
  },
  textField: {
    backgroundColor: theme.colors.inputBackground || theme.colors.card,
    borderRadius: theme.radii.button,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  textFieldInput: {
    color: theme.colors.textMain,
    fontFamily: theme.font.family.medium,
    fontSize: theme.font.size.label,
  },
  collapsibleSourceCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sourceSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.card,
  },
  sourceSummaryName: {
    flex: 1,
    fontSize: theme.font.size.label,
    color: theme.colors.textMain,
    fontFamily: theme.font.family.bold,
  },
  sourceSummaryType: {
    fontSize: theme.font.size.note,
    color: theme.colors.textSubtle,
    marginLeft: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  sourceSummaryBalance: {
    fontSize: theme.font.size.label,
    color: theme.colors.accent,
    fontFamily: theme.font.family.bold,
    marginRight: theme.spacing.sm,
  },
  expandCollapseIcon: {
    fontSize: 16,
    color: theme.colors.textSubtle,
    marginRight: theme.spacing.sm,
  },
  sourceEditSection: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  sourceList: {
    marginTop: theme.spacing.sm,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.button,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sourceName: {
    flex: 1,
    fontSize: theme.font.size.label,
    color: theme.colors.textMain,
    fontFamily: theme.font.family.bold,
  },
  sourceType: {
    fontSize: theme.font.size.note,
    color: theme.colors.textSubtle,
    marginHorizontal: theme.spacing.sm,
  },
  sourceBalance: {
    fontSize: theme.font.size.label,
    color: theme.colors.accent,
    fontFamily: theme.font.family.bold,
    marginRight: theme.spacing.sm,
  },
  editBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  editBtnText: {
    color: theme.colors.accent,
    fontFamily: theme.font.family.medium,
    fontSize: theme.font.size.note,
  },
  deleteBtn: {
    marginLeft: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  deleteBtnText: {
    color: theme.colors.error,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: theme.font.size.label,
    fontFamily: theme.font.family.bold,
    color: theme.colors.textMain,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  modalTextField: {
    backgroundColor: theme.colors.inputBackground || theme.colors.card,
    borderRadius: theme.radii.button,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    marginBottom: theme.spacing.sm,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  fabSafeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  fabWrapper: {
    width: '90%',
    marginBottom: theme.spacing.lg,
    borderRadius: 32,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  fab: {
    borderRadius: 32,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
});

export default SetupScreen; 