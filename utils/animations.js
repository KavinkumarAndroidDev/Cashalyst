import { Animated, Easing } from 'react-native';

/**
 * Cashalyst Animation Utilities
 * Consistent, subtle micro-animations following design guidelines
 */

// Animation durations (ms)
export const DURATIONS = {
  SHORT: 160,
  MEDIUM: 200,
  LONG: 300,
  EXTRA_LONG: 400,
};

// Standard easing curves
export const EASING = {
  EASE_IN_OUT: Easing.bezier(0.4, 0, 0.2, 1),
  EASE_OUT: Easing.bezier(0, 0, 0.2, 1),
  SPRING: Easing.elastic(1.3),
  BOUNCE: Easing.bounce,
};

// Scale animations
export const createScaleAnimation = (animatedValue, toValue = 1, duration = DURATIONS.SHORT) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: EASING.EASE_IN_OUT,
    useNativeDriver: true,
  });
};

export const createPressScaleAnimation = (animatedValue) => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 0.98,
      duration: DURATIONS.SHORT,
      easing: EASING.EASE_OUT,
      useNativeDriver: true,
    }),
    Animated.spring(animatedValue, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }),
  ]);
};

// Fade animations
export const createFadeAnimation = (animatedValue, toValue = 1, duration = DURATIONS.MEDIUM) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: EASING.EASE_IN_OUT,
    useNativeDriver: true,
  });
};

// Slide animations
export const createSlideAnimation = (animatedValue, toValue = 0, duration = DURATIONS.MEDIUM) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: EASING.EASE_IN_OUT,
    useNativeDriver: true,
  });
};

// Staggered animations for lists
export const createStaggeredAnimation = (animatedValues, duration = DURATIONS.MEDIUM, delay = 80) => {
  return Animated.stagger(
    delay,
    animatedValues.map((animatedValue) =>
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        easing: EASING.EASE_OUT,
        useNativeDriver: true,
      })
    )
  );
};

// Number counting animation
export const createCountingAnimation = (animatedValue, toValue, duration = DURATIONS.EXTRA_LONG) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: EASING.EASE_IN_OUT,
    useNativeDriver: false, // Number animations need JS thread
  });
};

// Spring animation for bouncy feedback
export const createSpringAnimation = (animatedValue, toValue = 1, tension = 300, friction = 10) => {
  return Animated.spring(animatedValue, {
    toValue,
    tension,
    friction,
    useNativeDriver: true,
  });
};

// Modal slide-up animation
export const createModalSlideAnimation = (animatedValue, toValue = 0, duration = DURATIONS.LONG) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: EASING.EASE_OUT,
    useNativeDriver: true,
  });
};

// Progress bar animation
export const createProgressAnimation = (animatedValue, toValue, duration = DURATIONS.LONG) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: EASING.EASE_OUT,
    useNativeDriver: false, // Width animations need JS thread
  });
};

// Shake animation for errors
export const createShakeAnimation = (animatedValue) => {
  return Animated.sequence([
    Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]);
};

// Ripple effect (for button presses)
export const createRippleAnimation = (animatedValue, scale = 2, duration = DURATIONS.LONG) => {
  return Animated.parallel([
    Animated.timing(animatedValue, {
      toValue: scale,
      duration,
      easing: EASING.EASE_OUT,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      easing: EASING.EASE_OUT,
      useNativeDriver: true,
    }),
  ]);
};

// Chart drawing animations
export const createChartAnimation = (animatedValue, duration = DURATIONS.EXTRA_LONG) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    easing: EASING.EASE_OUT,
    useNativeDriver: false, // Chart paths need JS thread
  });
};

// Utility to check for reduced motion preference
export const shouldReduceMotion = () => {
  // This would typically check system accessibility settings
  // For now, return false, but can be enhanced with react-native-device-info
  return false;
};

// Wrapper to respect accessibility preferences
export const createAccessibleAnimation = (animationFunction, fallbackValue = 1) => {
  if (shouldReduceMotion()) {
    return Animated.timing(new Animated.Value(0), {
      toValue: fallbackValue,
      duration: 0,
      useNativeDriver: true,
    });
  }
  return animationFunction();
};
