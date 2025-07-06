import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Surface } from 'react-native-paper';
import { AlertTriangle, CheckCircle, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import theme from '../utils/theme';

const AppModal = ({ 
  visible, 
  onDismiss, 
  title, 
  message, 
  type = 'info', // 'info', 'success', 'warning', 'error'
  actions = [],
  showCloseButton = true,
  blurBackground = false
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle color="#10B981" size={24} />;
      case 'warning':
      case 'error':
        return <AlertTriangle color="#EF4444" size={24} />;
      default:
        return <AlertTriangle color={theme.colors.accent} size={24} />;
    }
  };

  const getIconBackground = () => {
    switch (type) {
      case 'success':
        return 'rgba(16, 185, 129, 0.15)';
      case 'warning':
      case 'error':
        return 'rgba(239, 68, 68, 0.15)';
      default:
        return 'rgba(59, 130, 246, 0.15)';
    }
  };

  const getPrimaryButtonColor = () => {
    switch (type) {
      case 'success':
        return '#10B981';
      case 'warning':
      case 'error':
        return '#EF4444';
      default:
        return theme.colors.accent;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      {blurBackground ? (
        <BlurView intensity={20} style={styles.overlay}>
          <Surface style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <View style={[styles.iconBackground, { backgroundColor: getIconBackground() }]}>
                  {getIcon()}
                </View>
              </View>
              {showCloseButton && (
                <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
                  <X color={theme.colors.textSubtle} size={20} />
                </TouchableOpacity>
              )}
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              {message && <Text style={styles.message}>{message}</Text>}
            </View>

            {/* Actions */}
            {actions.length > 0 && (
              <View style={styles.actions}>
                {actions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.actionButton,
                      action.style === 'destructive' && { backgroundColor: '#EF4444' },
                      action.style === 'cancel' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border },
                      action.style === 'primary' && { backgroundColor: getPrimaryButtonColor() },
                      !action.style && { backgroundColor: getPrimaryButtonColor() },
                      actions.length === 1 && { flex: 1 }
                    ]}
                    onPress={() => {
                      action.onPress && action.onPress();
                      onDismiss();
                    }}
                  >
                    <Text style={[
                      styles.actionText,
                      action.style === 'cancel' && { color: theme.colors.textMain },
                      (action.style === 'destructive' || action.style === 'primary' || !action.style) && { color: '#fff' }
                    ]}>
                      {action.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Surface>
        </BlurView>
      ) : (
        <View style={styles.overlay}>
          <Surface style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <View style={[styles.iconBackground, { backgroundColor: getIconBackground() }]}>
                  {getIcon()}
                </View>
              </View>
              {showCloseButton && (
                <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
                  <X color={theme.colors.textSubtle} size={20} />
                </TouchableOpacity>
              )}
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              {message && <Text style={styles.message}>{message}</Text>}
            </View>

            {/* Actions */}
            {actions.length > 0 && (
              <View style={styles.actions}>
                {actions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.actionButton,
                      action.style === 'destructive' && { backgroundColor: '#EF4444' },
                      action.style === 'cancel' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border },
                      action.style === 'primary' && { backgroundColor: getPrimaryButtonColor() },
                      !action.style && { backgroundColor: getPrimaryButtonColor() },
                      actions.length === 1 && { flex: 1 }
                    ]}
                    onPress={() => {
                      action.onPress && action.onPress();
                      onDismiss();
                    }}
                  >
                    <Text style={[
                      styles.actionText,
                      action.style === 'cancel' && { color: theme.colors.textMain },
                      (action.style === 'destructive' || action.style === 'primary' || !action.style) && { color: '#fff' }
                    ]}>
                      {action.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Surface>
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 0,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: 4,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: theme.font.family.bold,
    color: theme.colors.textMain,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: theme.font.family.regular,
    color: theme.colors.textSubtle,
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontFamily: theme.font.family.medium,
    fontWeight: '600',
  },
});

export default AppModal; 