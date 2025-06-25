import { Dimensions, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BASE_WIDTH = 375; // Reference width (e.g., iPhone 11)

const widthScale = SCREEN_WIDTH / BASE_WIDTH;

export const moderateScale = (size, factor = 0.5) =>
  size + (widthScale * size - size) * factor;

export const responsiveFontSize = (fontSize, factor = 0.5) => {
  const newSize = moderateScale(fontSize, factor);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}; 