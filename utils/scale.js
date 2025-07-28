import { Dimensions, PixelRatio, Platform } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BASE_WIDTH = 375; // Reference width (e.g., iPhone 11)
const BASE_HEIGHT = 812; // Reference height

const widthScale = SCREEN_WIDTH / BASE_WIDTH;
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;

// Enhanced scaling for better device compatibility
export const moderateScale = (size, factor = 0.5) => {
  const scaledSize = size + (widthScale * size - size) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(scaledSize));
};

export const responsiveFontSize = (fontSize, factor = 0.5) => {
  const newSize = moderateScale(fontSize, factor);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Height-based scaling for better vertical responsiveness
export const verticalScale = (size, factor = 0.5) => {
  const scaledSize = size + (heightScale * size - size) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(scaledSize));
};

// Minimum touch target size (44px for accessibility)
export const getMinimumTouchTarget = () => moderateScale(44);

// Check if device has small screen
export const isSmallScreen = () => SCREEN_WIDTH < 375;

// Check if device has large screen
export const isLargeScreen = () => SCREEN_WIDTH > 414;

// Get safe area adjustments for different devices
export const getSafeAreaAdjustment = () => {
  if (Platform.OS === 'ios') {
    return isSmallScreen() ? moderateScale(8) : moderateScale(16);
  }
  return moderateScale(16);
}; 