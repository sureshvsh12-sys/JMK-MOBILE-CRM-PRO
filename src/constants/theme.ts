import { Platform } from "react-native";

export const SEGMENT_COLORS = {
  finance: "#10B981",
  assets: "#D4A72C",
  solar: "#F97316",
} as const;

export const COLORS = {
  background: "#06111F",
  backgroundLight: "#F4F7FB",
  surface: "#0D1B2D",
  surfaceLight: "#15263B",
  surfaceElevated: "#1B2F48",
  surfaceGlass: "rgba(13,27,45,0.86)",
  primary: "#DC2626",
  primaryDark: "#991B1B",
  primarySoft: "rgba(220,38,38,0.14)",
  navy: "#07182A",
  white: "#FFFFFF",
  black: "#000000",
  text: "#F8FAFC",
  textMuted: "#9AAEC2",
  textSoft: "#C4D0DC",
  textDark: "#102033",
  border: "#263A52",
  borderSoft: "rgba(148,163,184,0.18)",
  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#DC2626",
  info: "#2563EB",
  finance: SEGMENT_COLORS.finance,
  assets: SEGMENT_COLORS.assets,
  solar: SEGMENT_COLORS.solar,
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
  xxl: 30,
  round: 999,
} as const;

export const SHADOW = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.28,
  shadowRadius: 12,
  elevation: 8,
} as const;

export const SOFT_SHADOW = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.14,
  shadowRadius: 8,
  elevation: 4,
} as const;

export const Colors = {
  light: {
    text: COLORS.textDark,
    textSecondary: "#687076",
    background: COLORS.backgroundLight,
    backgroundElement: COLORS.white,
    backgroundSelected: "#E8EEF5",
    tint: COLORS.primary,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: COLORS.primary,
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    background: COLORS.background,
    backgroundElement: COLORS.surface,
    backgroundSelected: COLORS.surfaceLight,
    tint: COLORS.white,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: COLORS.primary,
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColor = keyof (typeof Colors)[ColorScheme];
export type SegmentKey = keyof typeof SEGMENT_COLORS;

export const Spacing = {
  one: SPACING.one,
  two: SPACING.two,
  three: SPACING.three,
  four: SPACING.four,
  five: SPACING.five,
  six: SPACING.six,
} as const;

export function getSegmentColor(segment?: string | null): string {
  const normalized = (segment ?? "").trim().toLowerCase();

  if (normalized.includes("financ")) return SEGMENT_COLORS.finance;
  if (normalized.includes("asset") || normalized.includes("property") || normalized.includes("real")) {
    return SEGMENT_COLORS.assets;
  }
  if (normalized.includes("solar")) return SEGMENT_COLORS.solar;

  return COLORS.info;
}

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

export const BottomTabInset = 82;
export const MaxContentWidth = 960;
