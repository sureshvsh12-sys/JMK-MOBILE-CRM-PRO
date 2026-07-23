import { Platform } from "react-native";

export const COLORS = {
  background: "#07111F",
  surface: "#0F1C2E",
  surfaceLight: "#17263B",
  primary: "#DC2626",
  primaryDark: "#991B1B",
  white: "#FFFFFF",
  black: "#000000",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
  border: "#26364D",
  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#DC2626",
  info: "#2563EB",
  finance: "#2563EB",
  assets: "#DC2626",
  solar: "#F59E0B",
} as const;

export const SPACING = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
} as const;

export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  round: 999,
} as const;

export const SHADOW = {
  shadowColor: "#000000",
  shadowOffset: {
    width: 0,
    height: 6,
  },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 8,
} as const;

export const Colors = {
  light: {
    text: "#11181C",
    textSecondary: "#687076",
    background: "#FFFFFF",
    backgroundElement: "#F1F5F9",
    backgroundSelected: "#E2E8F0",
    tint: "#DC2626",
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: "#DC2626",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    background: "#07111F",
    backgroundElement: "#0F1C2E",
    backgroundSelected: "#17263B",
    tint: "#FFFFFF",
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#DC2626",
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColor = keyof (typeof Colors)[ColorScheme];

export const Spacing = {
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
} as const;

const defaultFonts = {
  sans: "normal",
  serif: "serif",
  rounded: "normal",
  mono: "monospace",
};

export const Fonts =
  Platform.select({
    ios: {
      sans: "system-ui",
      serif: "ui-serif",
      rounded: "ui-rounded",
      mono: "ui-monospace",
    },
    default: defaultFonts,
    web: {
      sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      serif: "Georgia, 'Times New Roman', serif",
      rounded: "'Arial Rounded MT Bold', 'Trebuchet MS', sans-serif",
      mono: "SFMono-Regular, Consolas, 'Liberation Mono', monospace",
    },
  }) ?? defaultFonts;

export const BottomTabInset = 84;
export const MaxContentWidth = 960;
