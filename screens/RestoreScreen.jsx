import React, { useState } from 'react';//import react and state hook
import { View, Text, Platform, StatusBar, Animated } from 'react-native';//RN UI components
import * as DocumentPicker from 'expo-document-picker'; //Document picker API
import AppButton from '../components/AppButton';
import AppModal from '../components/AppModal';
import { Download, ArrowLeft, FileText, Users } from 'lucide-react-native';
import { Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../utils/theme';
import backupService from '../utils/backupService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useStore from '../hooks/useStore';
import { CommonActions } from '@react-navigation/native';
import globalEvents, { EVENT_TYPES } from '../utils/globalEvents';

const RestoreScreen = ({ navigation, onSetupComplete }) => {
  //state variables
  const [showInfoModal, setShowInfoModal] = useState(false);//info modal visibility
  const [showErrorModal, setShowErrorModal] = useState(false);//error success modal visibility
  const [errorMessage, setErrorMessage] = useState('');//modal message text
  const [isRestoring, setIsRestoring] = useState(false);//loading state
  const [restoreSuccess, setRestoreSuccess] = useState(false);//success flag
  const [restoreProgress, setRestoreProgress] = useState(0);//progress percentage
  const [backupPreview, setBackupPreview] = useState(null);//backup preview data
  const [progressAnim] = useState(new Animated.Value(0));//progress animation
  //restore from device handler
  const handleRestoreFromDevice = async () => {
    setErrorMessage('No automatic backup found on this device.');
    setShowErrorModal(true);
  };
  //restore from file handler
  const handleRestoreFromFile = async () => {
    setIsRestoring(true);
    setRestoreProgress(0);
    
    try {
      // Start progress animation
      Animated.timing(progressAnim, {
        toValue: 0.3,
        duration: 500,
        useNativeDriver: false,
      }).start();
      setRestoreProgress(30);

      const result = await backupService.restoreBackupFromExternalFile();
      
      // Update progress
      Animated.timing(progressAnim, {
        toValue: 0.7,
        duration: 500,
        useNativeDriver: false,
      }).start();
      setRestoreProgress(70);

      // Set setup_complete to 'true' after restore
      await AsyncStorage.setItem('setup_complete', 'true');
      
      // Complete progress
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
      setRestoreProgress(100);

      // Show success and navigate
      setErrorMessage(result.message || 'Backup restored successfully!');
      setRestoreSuccess(true);
      setShowErrorModal(true);
      
      if (onSetupComplete) onSetupComplete();
      
      // Reload app state with complete refresh
      if (typeof useStore.getState === 'function') {
        await useStore.getState().refreshAllData();
      }

      // Emit global event for data restoration
      globalEvents.emit(EVENT_TYPES.DATA_RESTORED);

      // Auto-navigate to main app after a delay
      setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }]
          })
        );
      }, 2000);

    } catch (err) {
      setErrorMessage(err.message || 'Failed to restore backup.');
      setRestoreSuccess(false);
      setShowErrorModal(true);
      setRestoreProgress(0);
      progressAnim.setValue(0);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      {/* Header with back button and step indicator */}
      <View style={{ paddingTop: 20, paddingBottom: 20, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <AppButton
            style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border }}
            onPress={() => {
              if (!restoreSuccess) navigation.goBack();
            }}
          >
            <ArrowLeft color={theme.colors.textMain} size={22} />
          </AppButton>
          <Text style={{ fontFamily: theme.font?.family?.bold || 'System', fontSize: 20, color: theme.colors.textMain, letterSpacing: -0.3 }}>Restore your data</Text>
          <View style={{ width: 40 }} />
        </View>
        
        
      </View>
      {/* Main content centered */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg }}>
        <Surface style={{ width: 340, maxWidth: '100%', borderRadius: 18, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: 28, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12 }}>
          <Download color={theme.colors.accent} size={44} style={{ marginBottom: 16 }} />
          <Text style={{ fontFamily: theme.font?.family?.bold || 'System', fontSize: 22, color: theme.colors.textMain, marginBottom: 8, textAlign: 'center', maxWidth: 320 }}>
            Restore from Backup
          </Text>
          <Text style={{ fontFamily: theme.font?.family?.medium || 'System', fontSize: 15, color: theme.colors.textSubtle, textAlign: 'center', lineHeight: 22, maxWidth: 320, marginBottom: 18 }}>
            You can restore your previous data from an automatic backup (if available) or select a backup file manually. This is useful if you are reinstalling the app or switching devices.
          </Text>

          {/* Progress bar when restoring */}
          {isRestoring && (
            <View style={{ width: '100%', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontFamily: theme.font?.family?.medium || 'System', color: theme.colors.textSubtle }}>
                  Restoring backup...
                </Text>
                <Text style={{ fontSize: 14, fontFamily: theme.font?.family?.bold || 'System', color: theme.colors.accent }}>
                  {restoreProgress}%
                </Text>
              </View>
              <View style={{ height: 4, backgroundColor: theme.colors.border, borderRadius: 2, overflow: 'hidden' }}>
                <Animated.View 
                  style={{
                    height: '100%',
                    backgroundColor: theme.colors.accent,
                    borderRadius: 2,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }}
                />
              </View>
            </View>
          )}

          {/* Backup preview */}
          {backupPreview && (
            <View style={{ 
              width: '100%', 
              backgroundColor: theme.colors.background, 
              borderRadius: 12, 
              padding: 16, 
              marginBottom: 20,
              borderWidth: 1,
              borderColor: theme.colors.border
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <FileText color={theme.colors.accent} size={20} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 16, fontFamily: theme.font?.family?.bold || 'System', color: theme.colors.textMain }}>
                  Backup Preview
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontFamily: theme.font?.family?.medium || 'System', color: theme.colors.textSubtle }}>
                  Transactions:
                </Text>
                <Text style={{ fontSize: 14, fontFamily: theme.font?.family?.bold || 'System', color: theme.colors.textMain }}>
                  {String(backupPreview.transactionCount || 0)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontFamily: theme.font?.family?.medium || 'System', color: theme.colors.textSubtle }}>
                  Accounts:
                </Text>
                <Text style={{ fontSize: 14, fontFamily: theme.font?.family?.bold || 'System', color: theme.colors.textMain }}>
                  {String(backupPreview.accountCount || 0)}
                </Text>
              </View>
              {backupPreview.username && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, fontFamily: theme.font?.family?.medium || 'System', color: theme.colors.textSubtle }}>
                    User:
                  </Text>
                  <Text style={{ fontSize: 14, fontFamily: theme.font?.family?.bold || 'System', color: theme.colors.textMain }}>
                    {backupPreview.username}
                  </Text>
                </View>
              )}
            </View>
          )}
          
          <AppButton
            style={{ marginTop: 8, backgroundColor: theme.colors.accent, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, width: '100%' }}
            textStyle={{ color: '#fff', fontFamily: theme.font?.family?.bold || 'System', fontSize: 16 }}
            onPress={handleRestoreFromDevice}
            disabled={isRestoring}
          >
            <Text style={{ color: '#fff', fontFamily: theme.font?.family?.bold || 'System', fontSize: 16 }}>Restore from Device</Text>
          </AppButton>
          <AppButton
            style={{ marginTop: 12, backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.accent, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, width: '100%' }}
            textStyle={{ color: theme.colors.accent, fontFamily: theme.font?.family?.bold || 'System', fontSize: 16 }}
            onPress={handleRestoreFromFile}
            disabled={isRestoring}
            loading={isRestoring}
          >
            <Text style={{ color: theme.colors.accent, fontFamily: theme.font?.family?.bold || 'System', fontSize: 16 }}>Restore from File</Text>
          </AppButton>
          <AppButton
            style={{ marginTop: 20, backgroundColor: 'transparent', width: '100%' }}
            textStyle={{ color: theme.colors.textSubtle, fontFamily: theme.font?.family?.medium || 'System', fontSize: 15, textDecorationLine: 'underline' }}
            onPress={() => setShowInfoModal(true)}
            disabled={isRestoring}
          >
            <Text style={{ color: theme.colors.textSubtle, fontFamily: theme.font?.family?.medium || 'System', fontSize: 15, textDecorationLine: 'underline', textAlign: 'center' }}>What is backup & restore?</Text>
          </AppButton>
        </Surface>
        <AppModal
          visible={showInfoModal}
          onDismiss={() => setShowInfoModal(false)}
          title="Backup & Restore"
          message={"Backup lets you save your accounts and transactions so you can restore them later. Use 'Restore from Device' for automatic backups, or 'Restore from File' to select a backup file from anywhere on your device."}
          actions={[
            { text: 'Got it', style: 'primary', onPress: () => setShowInfoModal(false) }
          ]}
          showCloseButton={false}
          blurBackground={true}
        />
        <AppModal
          visible={showErrorModal}
          onDismiss={async () => {
            setShowErrorModal(false);
            if (restoreSuccess) {
              await AsyncStorage.setItem('setup_complete', 'true');
              if (onSetupComplete) onSetupComplete();
              // Do not navigate or goBack here!
              setTimeout(() => {
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Main' }]
                  })
                );
              }, 300); // small delay so modal can close first
              
            }
          }}
          
          title={restoreSuccess ? 'Success' : 'Error'}
          type={restoreSuccess ? 'success' : 'error'}
          message={errorMessage}
          actions={[
            { 
              text: 'OK',
              style: 'primary',
              onPress: async () => {
                setShowErrorModal(false);
                if (restoreSuccess) {
                  await AsyncStorage.setItem('setup_complete', 'true');
                  if (onSetupComplete) onSetupComplete();
                  setTimeout(() => {
                    navigation.dispatch(
                      CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'Main' }]
                      })
                    );
                  }, 300); // small delay so modal can close first
                  
                  // Do not navigate or goBack here!
                }
              }
            }
          ]}
          showCloseButton={false}
          blurBackground={true}
        />
      </View>
    </SafeAreaView>
  );
};

export default RestoreScreen; 