import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ChevronLeft, ChevronRight, Check, CheckCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useStore from '../hooks/useStore';
import { generateId } from '../utils/formatCurrency';
import AppButton from '../components/AppButton';
import AppTextField from '../components/AppTextField';
import AppDropdown from '../components/AppDropdown';
import AppModal from '../components/AppModal';
import theme from '../utils/theme';
import { responsiveFontSize, moderateScale } from '../utils/scale';
import { CommonActions } from '@react-navigation/native';
import { 
  createFadeAnimation, 
  createSlideAnimation, 
  createProgressAnimation,
  createPressScaleAnimation,
  DURATIONS,
  EASING 
} from '../utils/animations';

const { width, height } = Dimensions.get('window');

const ProgressiveSetupScreen = ({ navigation, onSetupComplete }) => {
  const { addAccount, loading } = useStore();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [modalVisible, setModalVisible] = useState(true);
  const totalSteps = 4;
  
  // Step 1: Name
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  
  // Step 2: Sources
  const [sources, setSources] = useState([]);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [sourceForm, setSourceForm] = useState({ type: 'upi', name: '', balance: '' });
  
  // UI state
  const [progressAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(0));
  const [buttonScaleAnim] = useState(new Animated.Value(1));
  const [checkmarkAnim] = useState(new Animated.Value(0));
  const [completionFadeAnim] = useState(new Animated.Value(0));
  const [isCompleting, setIsCompleting] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Source type definitions
  const sourceTypes = {
    upi: { label: 'UPI' },
    bank: { label: 'Bank Account' },
    cash: { label: 'Cash' },
    wallet: { label: 'Digital Wallet' },
    custom: { label: 'Custom' },
  };

  useEffect(() => {
    // Enhanced progress bar animation with easing
    createProgressAnimation(progressAnim, currentStep / totalSteps, DURATIONS.MEDIUM).start();

    // Add initial empty source on step 2
    if (currentStep === 2 && sources.length === 0) {
      addNewSource();
    }

    // Trigger completion animation for step 4
    if (currentStep === 4) {
      // Staggered completion animations with proper spring values
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          createFadeAnimation(completionFadeAnim, 1, DURATIONS.LONG),
          Animated.sequence([
            Animated.delay(300),
            Animated.spring(checkmarkAnim, {
              toValue: 1,
              tension: 150,
              friction: 8,
              useNativeDriver: true,
            })
          ])
        ])
      ]).start();
    }
  }, [currentStep]);

  // Source management functions
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

  const updateSource = (id, field, value) => {
    setSources(prev => prev.map(source =>
      source.id === id ? { ...source, [field]: value } : source
    ));
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
    const trimmedName = sourceForm.name.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter a source name');
      setShowErrorModal(true);
      return;
    }
    if (!sourceForm.balance || parseFloat(sourceForm.balance) < 0) {
      setErrorMessage('Please enter a valid balance');
      setShowErrorModal(true);
      return;
    }

    // Check for duplicates
    const duplicate = sources.some(s => 
      s.name.trim().toLowerCase() === trimmedName.toLowerCase() && 
      (!editingSource || s.id !== editingSource.id)
    );
    if (duplicate) {
      setErrorMessage('A money source with this name already exists');
      setShowErrorModal(true);
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
  };

  // Navigation functions with enhanced animations
  const handleNext = () => {
    if (currentStep === 1) {
      if (!username.trim()) {
        setUsernameError('Please enter your name');
        return;
      }
      setUsernameError('');
    } else if (currentStep === 2) {
      const validSources = sources.filter(s => s.name.trim() && s.balance && parseFloat(s.balance) > 0);
      if (validSources.length === 0) {
        setErrorMessage('Please add at least one money source with a valid balance');
        setShowErrorModal(true);
        return;
      }
    }

    if (currentStep < totalSteps) {
      // Enhanced slide transition with proper easing
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: DURATIONS.MEDIUM,
        easing: EASING.bezier,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep + 1);
        slideAnim.setValue(width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: DURATIONS.MEDIUM,
          easing: EASING.bezier,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      // Enhanced slide transition with proper easing
      Animated.timing(slideAnim, {
        toValue: width,
        duration: DURATIONS.MEDIUM,
        easing: EASING.bezier,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep - 1);
        slideAnim.setValue(-width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: DURATIONS.MEDIUM,
          easing: EASING.bezier,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  // Enhanced button handlers with spring feedback
  const handleNextWithAnimation = () => {
    createPressScaleAnimation(buttonScaleAnim).start(() => {
      handleNext();
    });
  };

  const handleBackWithAnimation = () => {
    createPressScaleAnimation(buttonScaleAnim).start(() => {
      handleBack();
    });
  };

  const handleFinishWithAnimation = () => {
    createPressScaleAnimation(buttonScaleAnim).start(() => {
      handleFinish();
    });
  };

  const handleClose = () => {
    setModalVisible(false);
    navigation.goBack();
  };

  const handleFinish = async () => {
    setIsCompleting(true);
    
    try {
      // Save username
      await AsyncStorage.setItem('username', username.trim());
      
      // Add all sources as accounts
      const validSources = sources.filter(s => s.name.trim() && s.balance && parseFloat(s.balance) > 0);
      for (const source of validSources) {
        await addAccount({
          id: generateId(),
          name: source.name.trim(),
          type: source.type,
          balance: parseFloat(source.balance),
        });
      }
      
      // Mark setup as complete
      await AsyncStorage.setItem('setup_complete', 'true');
      
      // Complete setup and navigate to main app
      if (onSetupComplete) onSetupComplete();
      
      setModalVisible(false);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }]
        })
      );
      
    } catch (error) {
      console.error('Setup error:', error);
      setErrorMessage('Failed to complete setup. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsCompleting(false);
    }
  };

  const getTotalBalance = () => {
    return sources.reduce((sum, s) => sum + (parseFloat(s.balance) || 0), 0);
  };

  // Stable callback functions to prevent TextInput remounts
  const handleUsernameChange = useCallback((text) => {
    setUsername(text);
    if (text.trim().length > 0) {
      setUsernameError('');
    }
  }, []); // Completely stable - no dependencies

  const handleSourceFormNameChange = useCallback((text) => {
    setSourceForm(prev => ({ ...prev, name: text }));
  }, []);

  const handleSourceFormBalanceChange = useCallback((text) => {
    setSourceForm(prev => ({ ...prev, balance: text }));
  }, []);

  // Simple step rendering with persistent TextInput - all steps always rendered
  const renderAllSteps = () => {
    return (
      <View style={{ flex: 1 }}>
        {/* Step 1 - Username */}
        <View style={[
          styles.stepContent, 
          currentStep !== 1 && { position: 'absolute', top: -9999, left: -9999, opacity: 0 }
        ]}>
          <Text style={styles.stepTitle}>What should we call you?</Text>
          <Text style={styles.stepDescription}>
            We'll use this to personalize your experience
          </Text>
          
          <AppTextField
            key="username-input-persistent" // Fixed key to prevent remounting
            value={username}
            onChangeText={handleUsernameChange}
            placeholder="Enter your name"
            autoCapitalize="words"
            maxLength={24}
            error={!!usernameError}
            helperText={usernameError}
            autoFocus={currentStep === 1}
          />
        </View>

        {/* Step 2 - Sources */}
        <View style={[
          styles.stepContent, 
          currentStep !== 2 && { position: 'absolute', top: -9999, left: -9999, opacity: 0 }
        ]}>
          <Text style={styles.stepTitle}>Add your money accounts</Text>
          <Text style={styles.stepDescription}>
            Where do you keep your money? Add your bank accounts, wallets, and cash.
          </Text>
          
          <ScrollView style={styles.sourcesList} showsVerticalScrollIndicator={false}>
            {sources.map((source, index) => (
              <SourceCard key={source.id} source={source} index={index} />
            ))}
            
            <TouchableOpacity style={styles.addSourceButton} onPress={() => openSourceModal()}>
              <Text style={styles.addSourceText}>+ Add another source</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Step 3 - Review */}
        <View style={[
          styles.stepContent, 
          currentStep !== 3 && { position: 'absolute', top: -9999, left: -9999, opacity: 0 }
        ]}>
          <Text style={styles.stepTitle}>Review your setup</Text>
          <Text style={styles.stepDescription}>
            Everything looks good? You can edit these later in settings.
          </Text>
          
          <View style={styles.reviewCard}>
            <Text style={styles.reviewLabel}>Name</Text>
            <Text style={styles.reviewValue}>{username}</Text>
            
            <Text style={[styles.reviewLabel, { marginTop: 16 }]}>
              Money Sources ({sources.filter(s => s.name.trim() && s.balance && parseFloat(s.balance) > 0).length})
            </Text>
            {sources.filter(s => s.name.trim() && s.balance && parseFloat(s.balance) > 0).map((source, index) => (
              <View key={source.id} style={styles.reviewSourceRow}>
                <Text style={styles.reviewSourceName}>{source.name}</Text>
                <Text style={styles.reviewSourceBalance}>
                  ₹{parseFloat(source.balance).toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
            
            <View style={styles.reviewTotalRow}>
              <Text style={styles.reviewTotalLabel}>Total Balance</Text>
              <Text style={styles.reviewTotalValue}>
                ₹{getTotalBalance().toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Step 4 - Finish with completion animations */}
        <Animated.View style={[
          styles.stepContent, 
          styles.finishContent,
          currentStep !== 4 && { position: 'absolute', top: -9999, left: -9999, opacity: 0 },
          { opacity: completionFadeAnim }
        ]}>
          <Animated.View style={[
            styles.finishIconContainer,
            { 
              transform: [
                { scale: checkmarkAnim },
                { 
                  rotate: checkmarkAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })
                }
              ] 
            }
          ]}>
            <CheckCircle color={theme.colors.accentGreen || theme.colors.accent} size={56} strokeWidth={2} />
          </Animated.View>
          <Animated.Text style={[
            styles.finishTitle,
            { 
              opacity: completionFadeAnim,
              transform: [{ 
                translateY: completionFadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }]
            }
          ]}>
            You're all set!
          </Animated.Text>
          <Animated.Text style={[
            styles.finishDescription,
            { 
              opacity: completionFadeAnim,
              transform: [{ 
                translateY: completionFadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0]
                })
              }]
            }
          ]}>
            Your financial tracking journey begins now. Start adding transactions to see your spending patterns.
          </Animated.Text>
        </Animated.View>
      </View>
    );
  };

  const SourceCard = React.memo(({ source, index }) => (
    <View style={styles.sourceCard}>
      <View style={styles.sourceCardHeader}>
        <Text style={styles.sourceCardTitle}>Source {index + 1}</Text>
        <TouchableOpacity onPress={() => removeSource(source.id)}>
          <X color={theme.colors.textSubtle} size={20} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.sourceCardContent} 
        onPress={() => openSourceModal(source)}
      >
        <Text style={styles.sourceCardName}>
          {source.name || 'Tap to add details'}
        </Text>
        <Text style={styles.sourceCardBalance}>
          {source.balance ? `₹${parseFloat(source.balance).toLocaleString('en-IN')}` : '₹0'}
        </Text>
      </TouchableOpacity>
    </View>
  ));

  return (
    <Modal
      visible={modalVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X color={theme.colors.textMain} size={24} />
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }
                ]} 
              />
            </View>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <KeyboardAvoidingView 
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <Animated.View style={[styles.animatedContent]}>
            {renderAllSteps()}
          </Animated.View>
        </KeyboardAvoidingView>

        {/* Footer with enhanced button animations */}
        <View style={styles.footer}>
          {currentStep > 1 && currentStep < 4 ? (
            // Two buttons layout - Back and Next/Continue
            <View style={styles.twoButtonContainer}>
              <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScaleAnim }] }]}>
                <AppButton
                  variant="outlined"
                  onPress={handleBackWithAnimation}
                  style={styles.backButtonTwoLayout}
                  title="Back"
                  labelStyle={styles.buttonText}
                />
              </Animated.View>
              
              <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScaleAnim }] }]}>
                <AppButton
                  onPress={handleNextWithAnimation}
                  style={styles.nextButtonTwoLayout}
                  title={currentStep === 3 ? "Continue" : "Next"}
                  labelStyle={styles.buttonText}
                />
              </Animated.View>
            </View>
          ) : (
            // Single button layout
            <View style={styles.singleButtonContainer}>
              {currentStep === 1 && (
                <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScaleAnim }] }]}>
                  <AppButton
                    onPress={handleNextWithAnimation}
                    style={styles.fullWidthButton}
                    title="Next"
                    labelStyle={styles.buttonText}
                  />
                </Animated.View>
              )}
              
              {currentStep === 4 && (
                <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScaleAnim }] }]}>
                  <AppButton
                    onPress={handleFinishWithAnimation}
                    style={styles.fullWidthButton}
                    title="Go to Dashboard"
                    loading={isCompleting}
                    labelStyle={styles.buttonText}
                  />
                </Animated.View>
              )}
            </View>
          )}
        </View>

        {/* Source Modal */}
        <Modal
          visible={showSourceModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSourceModal(false)}
        >
          <View style={styles.sourceModalOverlay}>
            <View style={styles.sourceModalContent}>
              <View style={styles.sourceModalHeader}>
                <Text style={styles.sourceModalTitle}>
                  {editingSource ? 'Edit Source' : 'Add Money Source'}
                </Text>
                <TouchableOpacity onPress={() => setShowSourceModal(false)}>
                  <X color={theme.colors.textMain} size={24} />
                </TouchableOpacity>
              </View>
              
              <AppTextField
                value={sourceForm.name}
                onChangeText={handleSourceFormNameChange}
                placeholder="Source name (e.g., SBI Bank)"
              />
              
              <AppDropdown
                selectedValue={sourceForm.type}
                onValueChange={(value) => setSourceForm(prev => ({ ...prev, type: value }))}
                items={Object.entries(sourceTypes).map(([key, value]) => ({
                  value: key,
                  label: value.label,
                }))}
                placeholder="Select type"
                style={styles.sourceModalInput}
              />
              
              <AppTextField
                value={sourceForm.balance}
                onChangeText={handleSourceFormBalanceChange}
                placeholder="Current balance"
                keyboardType="numeric"
              />
              
              <View style={styles.sourceModalButtons}>
                <AppButton
                  variant="outlined"
                  title="Cancel"
                  onPress={() => setShowSourceModal(false)}
                  style={styles.sourceModalButton}
                />
                <AppButton
                  title="Save"
                  onPress={saveSource}
                  style={styles.sourceModalButton}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Error Modal */}
        <AppModal
          visible={showErrorModal}
          onDismiss={() => setShowErrorModal(false)}
          title="Error"
          message={errorMessage}
          type="error"
          actions={[
            { text: 'OK', onPress: () => setShowErrorModal(false) }
          ]}
          showCloseButton={false}
          blurBackground={true}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontFamily: theme.font?.family?.medium || 'System',
    color: theme.colors.textSubtle,
    marginBottom: 8,
  },
  progressBarContainer: {
    width: 120,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: 2,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  animatedContent: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: theme.font?.family?.bold || 'System',
    color: theme.colors.textMain,
    marginBottom: theme.spacing.sm,
    letterSpacing: -0.5,
  },
  stepDescription: {
    fontSize: 16,
    fontFamily: theme.font?.family?.medium || 'System',
    color: theme.colors.textSubtle,
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  textInput: {
    marginBottom: 0,
  },
  sourcesList: {
    flex: 1,
  },
  sourceCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  sourceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sourceCardTitle: {
    fontSize: 14,
    fontFamily: theme.font?.family?.medium || 'System',
    color: theme.colors.textSubtle,
  },
  sourceCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceCardName: {
    fontSize: 16,
    fontFamily: theme.font?.family?.medium || 'System',
    color: theme.colors.textMain,
    flex: 1,
  },
  sourceCardBalance: {
    fontSize: 16,
    fontFamily: theme.font?.family?.bold || 'System',
    color: theme.colors.accent,
  },
  addSourceButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  addSourceText: {
    fontSize: 16,
    fontFamily: theme.font?.family?.medium || 'System',
    color: theme.colors.accent,
  },
  reviewCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  reviewLabel: {
    fontSize: 14,
    fontFamily: theme.font?.family?.medium || 'System',
    color: theme.colors.textSubtle,
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 18,
    fontFamily: theme.font?.family?.bold || 'System',
    color: theme.colors.textMain,
  },
  reviewSourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  reviewSourceName: {
    fontSize: 16,
    fontFamily: theme.font?.family?.medium || 'System',
    color: theme.colors.textMain,
  },
  reviewSourceBalance: {
    fontSize: 16,
    fontFamily: theme.font?.family?.bold || 'System',
    color: theme.colors.textMain,
  },
  reviewTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  reviewTotalLabel: {
    fontSize: 16,
    fontFamily: theme.font?.family?.bold || 'System',
    color: theme.colors.textMain,
  },
  reviewTotalValue: {
    fontSize: 18,
    fontFamily: theme.font?.family?.bold || 'System',
    color: theme.colors.accent,
  },
  finishContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  finishTitle: {
    fontSize: 28,
    fontFamily: theme.font?.family?.bold || 'System',
    color: theme.colors.textMain,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  finishDescription: {
    fontSize: 16,
    fontFamily: theme.font?.family?.medium || 'System',
    color: theme.colors.textSubtle,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl + 30 : theme.spacing.xl + 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    minHeight: moderateScale(90), // Ensure minimum height
  },
  twoButtonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: theme.spacing.md,
  },
  singleButtonContainer: {
    width: '100%',
  },
  buttonWrapper: {
    flex: 1,
  },
  backButtonTwoLayout: {
    width: '100%',
    height: moderateScale(56),
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonTwoLayout: {
    width: '100%',
    height: moderateScale(56),
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidthButton: {
    width: '100%',
    height: moderateScale(56),
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: moderateScale(18),
    fontFamily: theme.font?.family?.bold || 'System',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  sourceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  sourceModalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  sourceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sourceModalTitle: {
    fontSize: 18,
    fontFamily: theme.font?.family?.bold || 'System',
    color: theme.colors.textMain,
  },
  sourceModalInput: {
    marginBottom: theme.spacing.md,
  },
  sourceModalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  sourceModalButton: {
    flex: 1,
  },
});

export default ProgressiveSetupScreen;
