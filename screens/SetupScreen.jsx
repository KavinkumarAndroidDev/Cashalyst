import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { TextInput, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import useStore from '../hooks/useStore';
import { generateId } from '../utils/formatCurrency';
import AppButton from '../components/AppButton';
import AppTextField from '../components/AppTextField';
import AppDropdown from '../components/AppDropdown';
import { ArrowLeft } from 'lucide-react-native';
import theme from '../utils/theme';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SetupScreen = ({ navigation, route }) => {
  const { addAccount, loading } = useStore();
  const onSetupComplete = route?.params?.onSetupComplete;
  const [sources, setSources] = useState([]);
  const [accountsLoaded, setAccountsLoaded] = useState(true);

  const sourceTypes = {
    upi: { label: 'UPI / Digital Wallet', icon: '💳' },
    bank: { label: 'Bank Account', icon: '🏦' },
    cash: { label: 'Cash', icon: '💵' },
    wallet: { label: 'Digital Wallet', icon: '📱' },
    custom: { label: 'Custom', icon: '🎯' },
  };

  const typeIcons = {
    upi: '💳',
    bank: '🏦',
    cash: '💵',
    wallet: '📱',
    custom: '🎯',
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
      icon: '💳',
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
      if (onSetupComplete) await onSetupComplete();
      await AsyncStorage.setItem('setup_complete', 'true');
      Alert.alert(
        'Welcome to Cashalyst!',
        'Your money sources have been set up successfully. You can now start tracking your transactions!',
        [
          {
            text: 'Get Started',
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            }),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to set up your money sources. Please try again.');
    }
  };

  const getTotalBalance = () => {
    return sources.reduce((total, source) => {
      const balance = parseFloat(source.balance) || 0;
      return total + balance;
    }, 0);
  };

  const canStartTracking = () => {
    return sources.some(source => source.name.trim() && source.balance !== '');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeIcon}>💸</Text>
        <Text style={styles.headerTitle}>Welcome to Cashalyst</Text>
        <Text style={styles.headerSubtitle}>
          Let's set the starting point!
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionTitle}>
            Tell us where you store your money
          </Text>
          <Text style={styles.instructionText}>
            Enter how much money you currently have in each source. Don't worry, you can edit these later anytime.
          </Text>
        </View>

        {/* Total Balance Preview */}
        <Surface style={styles.totalCard}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.1)', 'rgba(37, 99, 235, 0.05)']}
            style={styles.totalGradient}
          >
            <Text style={styles.totalLabel}>Total Balance</Text>
            <Text style={styles.totalAmount}>
              ₹{getTotalBalance().toLocaleString()}
            </Text>
          </LinearGradient>
        </Surface>

        {/* Money Sources */}
        <View style={styles.sourcesSection}>
          <Text style={styles.sectionTitle}>Your Sources</Text>
          {sources.map((source, index) => (
            <Surface key={source.id || source.name + '-' + index} style={[styles.sourceCard, { marginBottom: theme.spacing.lg, padding: theme.spacing.lg }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.sourceInfo}>
                  <Text style={styles.sourceIcon}>{source.icon}</Text>
                  <View style={styles.sourceDetails}>
                    <Text style={styles.sourceName}>{source.name}</Text>
                    <Text style={styles.sourceType}>
                      {sourceTypes[source.type]?.label || 'Custom'}
                    </Text>
                  </View>
                </View>
                {sources.length > 1 && (
                  <AppButton
                    variant="danger"
                    style={styles.removeButton}
                    onPress={() => removeSource(source.id)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </AppButton>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.md }}>
                <View style={{ flex: 1, marginRight: theme.spacing.md }}>
                  <AppDropdown
                    items={Object.entries(sourceTypes).map(([key, type]) => ({ label: `${type.icon} ${type.label}`, value: key }))}
                    selectedValue={source.type}
                    onValueChange={value => updateSource(source.id, 'type', value, typeIcons[value])}
                  />
                </View>
                <View style={{ flex: 2, marginRight: theme.spacing.md }}>
                  <AppTextField
                    value={source.name}
                    onChangeText={text => updateSource(source.id, 'name', text)}
                    placeholder="Source Name"
                  />
                </View>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <AppTextField
                    value={source.balance}
                    onChangeText={text => updateSource(source.id, 'balance', text)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>
            </Surface>
          ))}
          <AppButton
            variant="primary"
            style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.xl, alignSelf: 'center', minWidth: 200 }}
            onPress={addNewSource}
          >
            <Text style={styles.addMoreText}>+ Add Source</Text>
          </AppButton>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyContainer}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>
            This data stays private — only on your device
          </Text>
        </View>

        {/* Start Tracking Button */}
        <AppButton
          variant={!canStartTracking() ? "disabled" : "primary"}
          
          onPress={handleStartTracking}
          disabled={loading || !canStartTracking()}
        >
          <Text style={styles.startButtonText}>
            {loading ? 'Setting up...' : 'Start Tracking'}
          </Text>
        </AppButton>
      </ScrollView>
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
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  welcomeIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  instructionsContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  instructionText: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  totalCard: {
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
  totalGradient: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F9FAFB',
    letterSpacing: -0.5,
  },
  sourcesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  sourceCard: {
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
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sourceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sourceDetails: {
    flex: 1,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  sourceType: {
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 0.2,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginRight: 4,
    letterSpacing: 0.2,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  removeButtonText: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addMoreButton: {
    marginTop: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  addMoreIcon: {
    fontSize: 20,
    color: '#F9FAFB',
    marginRight: 8,
    fontWeight: 'bold',
  },
  addMoreText: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    padding: 12,
  },
  privacyIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  privacyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  startButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  startButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#6B7280',
  },
  startButtonText: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default SetupScreen; 