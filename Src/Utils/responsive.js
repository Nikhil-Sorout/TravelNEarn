import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions for iPhone 14 Pro (393 x 852)
const baseWidth = 393;
const baseHeight = 852;

// Scaling functions
export const scale = (size) => {
  const scaleFactor = SCREEN_WIDTH / baseWidth;
  return Math.round(size * scaleFactor);
};

export const verticalScale = (size) => {
  const scaleFactor = SCREEN_HEIGHT / baseHeight;
  return Math.round(size * scaleFactor);
};

export const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

export const moderateVerticalScale = (size, factor = 0.5) => {
  return size + (verticalScale(size) - size) * factor;
};

// Font scaling
export const fontScale = (size) => {
  const scaleFactor = SCREEN_WIDTH / baseWidth;
  const newSize = size * scaleFactor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Screen dimensions
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

// Responsive padding/margin
export const responsivePadding = {
  horizontal: scale(20),
  vertical: verticalScale(20),
  small: scale(10),
  medium: scale(15),
  large: scale(25),
};

// Responsive font sizes
export const responsiveFontSize = {
  xs: fontScale(12),
  sm: fontScale(14),
  md: fontScale(16),
  lg: fontScale(18),
  xl: fontScale(20),
  xxl: fontScale(24),
  xxxl: fontScale(32),
  title: fontScale(39),
};

// Responsive dimensions
export const responsiveDimensions = {
  logo: {
    width: scale(129),
    height: scale(129),
  },
  button: {
    width: Math.min(scale(361), SCREEN_WIDTH - 40), // Ensure button doesn't exceed screen width
    height: verticalScale(45),
  },
  icon: {
    small: scale(20),
    medium: scale(24),
    large: scale(32),
  },
}; 