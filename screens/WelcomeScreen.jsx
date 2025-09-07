import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlusCircle, DownloadCloud, Lock, Info } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppModal from '../components/AppModal';
import theme from '../utils/theme';
import { responsiveFontSize, moderateScale } from '../utils/scale';
import { 
  createStaggeredAnimation, 
  createFadeAnimation, 
  createPressScaleAnimation,
  DURATIONS 
} from '../utils/animations';

const { width } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim1] = useState(new Animated.Value(50));
  const [slideAnim2] = useState(new Animated.Value(50));
  const [showBackupInfo, setShowBackupInfo] = useState(false);

  useEffect(() => {
    // Check for existing username
    checkExistingUser();
    
    // Enhanced entrance animations using utility functions
    Animated.parallel([
      // Header fade-in
      createFadeAnimation(fadeAnim, 1, DURATIONS.LONG),
      
      // Staggered slide-in for action rows (animate from 50 to 0)
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(slideAnim1, {
            toValue: 0,
            duration: DURATIONS.MEDIUM,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(80), // 80ms stagger
            Animated.timing(slideAnim2, {
              toValue: 0,
              duration: DURATIONS.MEDIUM,
              useNativeDriver: true,
            })
          ])
        ])
      ])
    ]).start();
  }, []);

  const checkExistingUser = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
    } catch (error) {
      console.error('Error checking existing user:', error);
    }
  };

  const handleGetStarted = () => {
    navigation.navigate('ProgressiveSetup');
  };

  const handleRestoreBackup = () => {
    navigation.navigate('RestoreScreen');
  };

  const handleLearnMore = () => {
    setShowBackupInfo(true);
  };

  const ActionRow = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onPress, 
    animatedStyle,
    iconColor = theme.colors.accent 
  }) => {
    const [scaleAnim] = useState(new Animated.Value(1));

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View style={[styles.actionRowContainer, animatedStyle]}>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <Animated.View style={[styles.actionRowContent, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.actionIconContainer}>
              <Icon color={iconColor} size={24} strokeWidth={2} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>{title}</Text>
              <Text style={styles.actionSubtitle}>{subtitle}</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Top Area */}
        <View style={styles.topArea}>
          <Text style={styles.title}>
            {username ? `Welcome back, ${username}` : 'Welcome to Cashalyst'}
          </Text>
          <Text style={styles.subtitle}>
            Take control of your finances — private & offline.
          </Text>
        </View>

        {/* Center Content */}
        <View style={styles.centerContent}>
          {/* Action Rows */}
          <View style={styles.actionsContainer}>
            <ActionRow
              icon={PlusCircle}
              title="Get Started"
              subtitle="Quick step-by-step setup"
              onPress={handleGetStarted}
              animatedStyle={{
                transform: [{ translateY: slideAnim1 }],
              }}
            />

            <ActionRow
              icon={DownloadCloud}
              title="Restore from backup"
              subtitle="Recover existing Cashalyst data"
              onPress={handleRestoreBackup}
              iconColor={theme.colors.accentGreen}
              animatedStyle={{
                transform: [{ translateY: slideAnim2 }],
              }}
            />
          </View>
        </View>

        {/* Bottom Area */}
        <View style={styles.bottomArea}>
          <View style={styles.privacyNote}>
            <Lock color={theme.colors.textSubtle} size={16} />
            <Text style={styles.privacyText}>Your data stays private on your device</Text>
          </View>
          
          <TouchableOpacity onPress={handleLearnMore} style={styles.learnMoreButton}>
            <Text style={styles.learnMoreText}>Learn more about backups</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Backup Info Modal */}
      <AppModal
          visible={showBackupInfo}
          onDismiss={() => setShowBackupInfo(false)}
          title="Backup & Restore"
          message={"Backup lets you save your accounts and transactions so you can restore them later. Use 'Restore from Device' for automatic backups, or 'Restore from File' to select a backup file from anywhere on your device."}
          actions={[
            { text: 'Got it', style: 'primary', onPress: () => setShowBackupInfo(false) }
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
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  topArea: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontFamily: theme.font?.family?.bold || 'System',
    color: theme.colors.textMain,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: theme.font?.family?.medium || 'System',
    color: theme.colors.textSubtle,
    textAlign: 'center',
    lineHeight: 22,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  actionsContainer: {
    gap: theme.spacing.md,
  },
  actionRowContainer: {
    width: '100%',
  },
  actionRow: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  actionRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontFamily: theme.font?.family?.bold || 'System',
    color: theme.colors.textMain,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  actionSubtitle: {
    fontSize: 14,
    fontFamily: theme.font?.family?.medium || 'System',
    color: theme.colors.textSubtle,
    lineHeight: 18,
  },
  bottomArea: {
    alignItems: 'center',
    paddingBottom: theme.spacing.lg,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  privacyText: {
    fontSize: 13,
    fontFamily: theme.font?.family?.medium || 'System',
    color: theme.colors.textSubtle,
  },
  learnMoreButton: {
    paddingVertical: theme.spacing.sm,
  },
  learnMoreText: {
    fontSize: 14,
    fontFamily: theme.font?.family?.medium || 'System',
    color: theme.colors.accent,
    textDecorationLine: 'underline',
  },
});

export default WelcomeScreen;
