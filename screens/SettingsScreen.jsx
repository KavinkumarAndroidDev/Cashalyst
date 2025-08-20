import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Info, Database, User, Heart, Download, Upload, Trash2 } from 'lucide-react-native';
import useStore from '../hooks/useStore';
import AppButton from '../components/AppButton';
import AppModal from '../components/AppModal';
import theme from '../utils/theme';
import notificationService from '../utils/notificationService';
import backupService from '../utils/backupService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppTextField from '../components/AppTextField';
import { Linking } from 'react-native';
import Constants from 'expo-constants';

const SettingsScreen = ({ navigation }) => {
  //state variables for backup,notifications,UI , and user info
  const [hasBackup, setHasBackup] = useState(false);
  const [backupInfo, setBackupInfo] = useState(null);
  const [backupLocation, setBackupLocation] = useState(null);
  const [backupStorageInfo, setBackupStorageInfo] = useState(null);
  const [externalStorageAvailable, setExternalStorageAvailable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationStats, setNotificationStats] = useState(null);
  const [showBackupInfo, setShowBackupInfo] = useState(false);
  const [username, setUsername] = useState('');
  const [showEditName, setShowEditName] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNameError, setEditNameError] = useState('');
  //app global store(accounts,transactions and loaders)
  const { accounts, transactions, loadAccounts, loadTransactions } = useStore();
  //on mount:check notifications ,backup and load username
  useEffect(() => {
    checkNotificationStatus();
    checkBackupStatus();
    (async () => {
      const saved = await AsyncStorage.getItem('username');
      if (saved) setUsername(saved);
    })();
  }, []);
  //check current notification permission and stats 
  const checkNotificationStatus = async () => {
    try {
      const status = await notificationService.checkPermissionStatus();//permission status 
      const stats = await notificationService.getNotificationStats();//pending notifications
      
      console.log('Notification status check:', { status, stats });
      
      // Check if notifications are actually active (permission granted AND pending notifications)
      const hasPermission = status === 'granted';
      const hasActiveNotifications = stats.pendingCount > 0;
      
      console.log('Status result:', { hasPermission, hasActiveNotifications });
      
      // Show as enabled only if both permission granted AND notifications are scheduled
      setNotificationsEnabled(hasPermission && hasActiveNotifications);
      setNotificationStats(stats);
    } catch (error) {
      console.error('Failed to check notification status:', error);
      setNotificationsEnabled(false);
      setNotificationStats(null);
    }
  };
  //check backup presence and metadata
  const checkBackupStatus = async () => {
    try {
      const hasBackupData = await backupService.hasBackup();
      setHasBackup(hasBackupData);
      
      if (hasBackupData) {
        const info = await backupService.getBackupInfo();
        setBackupInfo(info);
      }
      
      const location = await backupService.getBackupLocation();
      setBackupLocation(location);
      
      const storageInfo = await backupService.getBackupStorageInfo();
      setBackupStorageInfo(storageInfo);
      
      const externalStorage = await backupService.checkExternalStorageAvailability();
      setExternalStorageAvailable(externalStorage);
    } catch (error) {
      console.error('Failed to check backup status:', error);
    }
  };

  //create backup in local storage
  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      await backupService.createBackup();
      setSuccessMessage('Backup created successfully');
      setShowSuccess(true);
      await checkBackupStatus();
    } catch (error) {
      setErrorMessage(error.message);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  //share after creating backup
  const handleCreateAndShareBackup = async () => {
    setLoading(true);
    try {
      // First create and save backup locally
      const result = await backupService.createBackupAndSave();
      
      // Then share it
      await backupService.shareBackupFile(result.filename);
      
      setSuccessMessage('Backup created and shared successfully');
      setShowSuccess(true);
      await checkBackupStatus();
    } catch (error) {
      setErrorMessage(error.message);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  //restore backup from app storage
  const handleRestoreBackup = async () => {
    setLoading(true);
    try {
      await backupService.restoreBackup();
      setSuccessMessage('Backup restored successfully');
      setShowSuccess(true);
      await checkBackupStatus();
    } catch (error) {
      setErrorMessage(error.message);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  //save backup to external storage 
  const handleCreateExternalBackup = async () => {
    setLoading(true);
    try {
      const result = await backupService.saveBackupToExternalStorage();
      setSuccessMessage(result.message);
      setShowSuccess(true);
      await checkBackupStatus();
    } catch (error) {
      setErrorMessage(error.message);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  //share backup by creating and saving it temporarily 
  const handleShareBackup = async () => {
    setLoading(true);
    try {
      // First create a backup, then share it
      const backup = await backupService.createBackup();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `cashalyst_backup_${timestamp}.json`;
      
      // Save to cache and share
      const cachePath = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(cachePath, JSON.stringify(backup, null, 2));
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(cachePath, {
          mimeType: 'application/json',
          dialogTitle: 'Share Cashalyst Backup'
        });
        setSuccessMessage('Backup shared successfully');
        setShowSuccess(true);
      } else {
        throw new Error('Sharing not available on this device');
      }
    } catch (error) {
      setErrorMessage(error.message);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  //restore backup from user selected file
  const handleRestoreFromExternalFile = async () => {
    setLoading(true);
    try {
      const result = await backupService.restoreBackupFromExternalFile();
      setSuccessMessage(result.message);
      setShowSuccess(true);
      await checkBackupStatus();
    } catch (error) {
      setErrorMessage(error.message);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  //show configuration modal before clearing all data 
  const handleClearData = () => {
    setShowConfirmModal(true);
  };

  const confirmClearData = async () => {
    setLoading(true);
    try {
      // Use the backup service to clear all data
      await backupService.clearAllData();
      
      // Clear the store state
      useStore.setState({
        transactions: [],
        accounts: [],
        monthlyStats: { income: 0, expenses: 0, savings: 0 },
        categoryStats: []
      });
      
      setSuccessMessage('All data cleared successfully');
      setShowSuccess(true);
    } catch (error) {
      setErrorMessage('Failed to clear data: ' + error.message);
      setShowError(true);
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };
  // toggle smart notifications on/off
  const handleToggleNotifications = async () => {
    try {
      if (notificationsEnabled) {
        // Disable notifications
        await notificationService.cancelAllNotifications();
        setNotificationsEnabled(false);
        setSuccessMessage('Smart notifications turned off');
        setShowSuccess(true);
        // Refresh status after disabling - longer delay to ensure cancellation
        setTimeout(() => checkNotificationStatus(), 2000);
      } else {
        // Enable smart notifications
        const initialized = await notificationService.initialize();
        if (initialized) {
          // Enable smart notifications
          await notificationService.enableSmartNotifications();
          setSuccessMessage('Smart notifications turned on');
          setShowSuccess(true);
          // Refresh status after enabling - longer delay to ensure scheduling
          setTimeout(() => checkNotificationStatus(), 5000);
        } else {
          setErrorMessage('Please enable notifications in your device settings');
          setShowError(true);
        }
      }
    } catch (error) {
      console.error('Notification toggle error:', error);
      if (error.message === 'Notification permission not granted') {
        setErrorMessage('Please enable notifications in your device settings');
      } else {
        setErrorMessage('Failed to update notification settings');
      }
      setShowError(true);
      // Refresh status to show correct state
      setTimeout(() => checkNotificationStatus(), 2000);
    }
  };
  //export data as json file
  const handleExportData = async () => {
    setLoading(true);
    try {
      const jsonData = await backupService.exportData();
      setSuccessMessage('Data exported successfully');
      setShowSuccess(true);
    } catch (error) {
      setErrorMessage(error.message);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  //component for each setting item row
  const SettingItem = ({ icon: Icon, title, subtitle, onPress, loading = false, danger = false }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: danger ? 'rgba(239, 68, 68, 0.2)' : theme.colors.border,
      }}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      }}>
        <Icon 
          color={danger ? '#EF4444' : theme.colors.accent} 
          size={20} 
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontFamily: theme.font.family.bold,
          fontSize: 16,
          color: theme.colors.textMain,
          marginBottom: 2,
        }}>
          {title}
        </Text>
        <Text style={{
          fontFamily: theme.font.family.medium,
          fontSize: 14,
          color: theme.colors.textSubtle,
        }}>
          {subtitle}
        </Text>
      </View>
      {loading && <ActivityIndicator size="small" color={theme.colors.accent} />}
    </TouchableOpacity>
  );
  // UI rendering
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={{ paddingTop: 20, paddingBottom: 20, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppButton
            style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border }}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color={theme.colors.textMain} size={22} />
          </AppButton>
          <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.section, color: theme.colors.textMain, letterSpacing: -0.3 }}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>
      {/*scrollable list of setting items */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Profile section at the top of the scroll */}
        <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 32 }}>
          <TouchableOpacity
            style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}
            onPress={() => { setEditName(username); setShowEditName(true); }}
            activeOpacity={0.85}
          >
            <Text style={{ color: theme.colors.buttonText || '#fff', fontFamily: theme.font.family.bold, fontSize: 28 }}>
              {username ? username.trim().charAt(0).toUpperCase() : 'U'}
            </Text>
          </TouchableOpacity>
          <Text style={{ fontFamily: theme.font.family.bold, fontSize: 18, color: theme.colors.textMain }}>{username || 'Your Name'}</Text>
          <Text style={{ fontFamily: theme.font.family.medium, fontSize: 13, color: theme.colors.textSubtle, marginTop: 2 }}>Tap to edit your name</Text>
        </View>
        <AppModal
          visible={showEditName}
          onDismiss={() => setShowEditName(false)}
          title="Edit Name"
          message={null}
          type="default"
          actions={[
            { text: 'Cancel', style: 'cancel', onPress: () => setShowEditName(false) },
            { text: 'Save', style: 'primary', onPress: async () => {
              if (!editName.trim()) {
                setEditNameError('Please enter your name.');
                return;
              }
              await AsyncStorage.setItem('username', editName.trim());
              setUsername(editName.trim());
              setShowEditName(false);
              setEditNameError('');
            }}
          ]}
          showCloseButton={false}
        >
          <AppTextField
            value={editName}
            onChangeText={text => {
              setEditName(text);
              if (text.trim().length > 0) setEditNameError('');
            }}
            placeholder="Enter your name"
            style={{ backgroundColor: theme.colors.inputBackground || theme.colors.card, borderRadius: theme.radii.button, paddingHorizontal: 20, marginTop: 12, height: 48, minHeight: 48, maxHeight: 48 }}
            inputStyle={{ color: theme.colors.textMain, fontFamily: theme.font.family.medium, fontSize: theme.font.size.label }}
            autoCapitalize="words"
            maxLength={24}
            editable={true}
            autoFocus={true}
          />
          {editNameError ? <Text style={{ color: theme.colors.error, fontSize: 13, marginTop: 2 }}>{editNameError}</Text> : null}
        </AppModal>

        {/* Notifications Section */}
        <Text style={{ fontFamily: theme.font.family.bold, fontSize: 18, color: theme.colors.textMain, marginBottom: 16, marginTop: 8 }}>Notifications</Text>
        
        <SettingItem
          icon={Bell}
          title="Smart Notifications"
          subtitle={notificationsEnabled ? 
            "Active - Tap to turn off" : 
            "Inactive - Tap to turn on"
          }
          onPress={handleToggleNotifications}
        />
        
        {notificationsEnabled && (
          <View style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: 'rgba(16, 185, 129, 0.2)',
          }}>
            <Text style={{
              fontFamily: theme.font.family.medium,
              fontSize: 12,
              color: '#10B981',
              textAlign: 'center',
            }}>
              💡 You'll receive daily reminders
            </Text>
          </View>
        )}
        
        {!notificationsEnabled && (
          <View style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: 'rgba(239, 68, 68, 0.2)',
          }}>
            <Text style={{
              fontFamily: theme.font.family.medium,
              fontSize: 12,
              color: '#EF4444',
              textAlign: 'center',
            }}>
              To completely disable notifications, go to device settings
            </Text>
          </View>
        )}

        {/* App Information Section */}
        <Text style={{ fontFamily: theme.font.family.bold, fontSize: 18, color: theme.colors.textMain, marginBottom: 16, marginTop: 24 }}>App Information</Text>
        
        <SettingItem
          icon={Info}
          title="Version"
          subtitle={Constants.expoConfig?.version || "2.0.1"}
          onPress={() => {}}
        />

        <SettingItem
          icon={Database}
          title="Data Summary"
          subtitle={`${transactions.length} transactions, ${accounts.length} accounts`}
          onPress={() => {}}
        />

        {/* Developer Info Section */}
        <Text style={{ fontFamily: theme.font.family.bold, fontSize: 18, color: theme.colors.textMain, marginBottom: 16, marginTop: 24 }}>Developer</Text>
        
        <SettingItem
          icon={User}
          title="Developer"
          subtitle="Kavinkumar R"
          onPress={() => {
            // Prefer portfolio, fallback to LinkedIn
            const url = 'https://kavinkumar-r.netlify.app/';
            const fallbackUrl = 'https://www.linkedin.com/in/kavinkumar442005/';
            Linking.openURL(url).catch(() => Linking.openURL(fallbackUrl));
          }}
        />

        <SettingItem
          icon={Heart}
          title="Made with ❤️"
          subtitle="React Native & Expo"
          onPress={() => {}}
        />

        {/* Backup Section */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 24 }}>
          <Text style={{ fontFamily: theme.font.family.bold, fontSize: 18, color: theme.colors.textMain, marginRight: 6 }}>Backup & Data</Text>
          <TouchableOpacity onPress={() => setShowBackupInfo(true)}>
            <Info color={theme.colors.accent} size={18} />
          </TouchableOpacity>
        </View>
        <AppModal
          visible={showBackupInfo}
          onDismiss={() => setShowBackupInfo(false)}
          title="Backup & Data"
          message={"You can create a backup of your accounts and transactions, restore from a backup file, or export your data. Backups help you keep your data safe if you switch devices or reinstall the app. It's recommended to back up regularly!"}
          actions={[
            { text: 'Got it', style: 'primary', onPress: () => setShowBackupInfo(false) }
          ]}
          showCloseButton={false}
        />
        
        {/* Primary Backup Options */}
        <SettingItem
          icon={Download}
          title="Create Backup"
          subtitle={hasBackup ? `Last backup: ${backupInfo ? new Date(backupInfo.timestamp).toLocaleDateString() : 'Unknown'}` : "Create a backup in app storage"}
          onPress={handleCreateBackup}
          loading={loading}
        />
        
        <SettingItem
          icon={Download}
          title="Create & Share Backup"
          subtitle="Create backup and save to your chosen location"
          onPress={handleCreateAndShareBackup}
          loading={loading}
        />
        
        <SettingItem
          icon={Upload}
          title="Restore from File"
          subtitle="Select a backup file from your device"
          onPress={handleRestoreFromExternalFile}
          loading={loading}
        />

        <SettingItem
          icon={Upload}
          title="Restore Local Backup"
          subtitle={hasBackup ? `${backupInfo?.transactionCount || 0} transactions, ${backupInfo?.accountCount || 0} accounts` : "No local backup to restore"}
          onPress={handleRestoreBackup}
          loading={loading}
        />

        {/* Export Option */}
        <SettingItem
          icon={Download}
          title="Export Data"
          subtitle="Share your current data as JSON file"
          onPress={handleExportData}
          loading={loading}
        />

        {/* Backup Info Section */}
        {backupStorageInfo && backupStorageInfo.fileCount > 0 && (
          <View style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: 'rgba(59, 130, 246, 0.2)',
          }}>
            <Text style={{
              fontFamily: theme.font.family.bold,
              fontSize: 14,
              color: theme.colors.textMain,
              marginBottom: 8,
            }}>
              App Backup Files
            </Text>
            <Text style={{
              fontFamily: theme.font.family.medium,
              fontSize: 12,
              color: theme.colors.textSubtle,
              marginBottom: 4,
            }}>
              Location: {backupLocation?.readablePath || 'App Documents/backups/'}
            </Text>
            <Text style={{
              fontFamily: theme.font.family.medium,
              fontSize: 12,
              color: theme.colors.textSubtle,
              marginBottom: 4,
            }}>
              Files: {backupStorageInfo.fileCount} • Size: {backupStorageInfo.totalSizeMB} MB
            </Text>
            <Text style={{
              fontFamily: theme.font.family.medium,
              fontSize: 12,
              color: theme.colors.textSubtle,
            }}>
              Note: These files are stored inside the app and will be lost if app is deleted.
            </Text>
          </View>
        )}

        {(!backupStorageInfo || backupStorageInfo.fileCount === 0) && hasBackup && (
          <View style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: 'rgba(16, 185, 129, 0.2)',
          }}>
            <Text style={{
              fontFamily: theme.font.family.bold,
              fontSize: 14,
              color: '#10B981',
              marginBottom: 8,
            }}>
              App Backup Available
            </Text>
            <Text style={{
              fontFamily: theme.font.family.medium,
              fontSize: 12,
              color: '#10B981',
              marginBottom: 4,
            }}>
              Last backup: {backupInfo ? new Date(backupInfo.timestamp).toLocaleDateString() : 'Unknown'}
            </Text>
            <Text style={{
              fontFamily: theme.font.family.medium,
              fontSize: 12,
              color: '#10B981',
            }}>
              Use "Restore Local Backup" to restore from app storage
            </Text>
          </View>
        )}

        {(!backupStorageInfo || backupStorageInfo.fileCount === 0) && !hasBackup && (
          <View style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: 'rgba(239, 68, 68, 0.2)',
          }}>
            <Text style={{
              fontFamily: theme.font.family.bold,
              fontSize: 14,
              color: '#EF4444',
              marginBottom: 8,
            }}>
              No Backups Found
            </Text>
            <Text style={{
              fontFamily: theme.font.family.medium,
              fontSize: 12,
              color: '#EF4444',
              marginBottom: 4,
            }}>
              Create a backup to protect your data
            </Text>
            <Text style={{
              fontFamily: theme.font.family.medium,
              fontSize: 12,
              color: '#EF4444',
            }}>
              Use "Create & Share Backup" to save backups to your preferred location
            </Text>
          </View>
        )}

        {/* Danger Zone */}
        <Text style={{ fontFamily: theme.font.family.bold, fontSize: 18, color: '#EF4444', marginBottom: 16, marginTop: 24 }}>Danger Zone</Text>
        
        <SettingItem
          icon={Trash2}
          title="Clear All Data"
          subtitle="Permanently delete all transactions and accounts"
          onPress={handleClearData}
          danger={true}
        />

      </ScrollView>

      {/* Success Snackbar */}
      <Snackbar
        visible={showSuccess}
        onDismiss={() => setShowSuccess(false)}
        duration={3000}
        style={{ backgroundColor: '#10B981', marginBottom: 32, marginHorizontal: 16, borderRadius: 12 }}
      >
        <Text style={{ color: '#fff', fontFamily: theme.font.family.medium, textAlign: 'center' }}>{successMessage}</Text>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        visible={showError}
        onDismiss={() => setShowError(false)}
        duration={4000}
        style={{ backgroundColor: '#EF4444', marginBottom: 32, marginHorizontal: 16, borderRadius: 12 }}
      >
        <Text style={{ color: '#fff', fontFamily: theme.font.family.medium, textAlign: 'center' }}>{errorMessage}</Text>
      </Snackbar>

      {/* Confirmation Modal */}
      <AppModal
        visible={showConfirmModal}
        onDismiss={() => setShowConfirmModal(false)}
        title="Clear All Data"
        message="This will permanently delete all your transactions and accounts. This action cannot be undone."
        type="warning"
        showCloseButton={false}
        actions={[
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setShowConfirmModal(false)
          },
          {
            text: "Clear Data",
            style: "destructive",
            onPress: confirmClearData
          }
        ]}
      />
    </SafeAreaView>
  );
};

export default SettingsScreen; 