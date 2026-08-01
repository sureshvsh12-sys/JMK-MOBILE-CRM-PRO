import { Platform } from "react-native";

export const SEGMENT_COLORS = {
  finance: "#059669",
  assets: "#C88A12",
  solar: "#F97316",
} as const;

export const COLORS = {
  background: "#EEF3F8",
  backgroundLight: "#F7F9FC",
  surface: "#FFFFFF",
  surfaceLight: "#F3F7FB",
  surfaceElevated: "#FFFFFF",
  surfaceGlass: "rgba(255,255,255,0.92)",
  primary: "#E3262E",
  primaryDark: "#B91C24",
  primarySoft: "rgba(227,38,46,0.10)",
  navy: "#071A2D",
  white: "#FFFFFF",
  black: "#000000",
  text: "#102033",
  textMuted: "#667C91",
  textSoft: "#34495E",
  textDark: "#102033",
  border: "#DCE6F1",
  borderSoft: "rgba(15,42,67,0.10)",
  success: "#059669",
  warning: "#D9970B",
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
  shadowColor: "#18324A",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 18,
  elevation: 6,
} as const;

export const SOFT_SHADOW = {
  shadowColor: "#18324A",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
} as const;

export const Colors = {
  light: {
    text: COLORS.text,
    textSecondary: COLORS.textMuted,
    background: COLORS.background,
    backgroundElement: COLORS.surface,
    backgroundSelected: "#E9F0F7",
    tint: COLORS.primary,
    icon: "#60758A",
    tabIconDefault: "#74879B",
    tabIconSelected: COLORS.primary,
  },
  dark: {
    text: "#F8FAFC",
    textSecondary: "#A9B8C7",
    background: "#06111F",
    backgroundElement: "#0D1B2D",
    backgroundSelected: "#172A40",
    tint: "#FFFFFF",
    icon: "#A9B8C7",
    tabIconDefault: "#95A8BB",
    tabIconSelected: "#FF6268",
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
  if (
    normalized.includes("asset") ||
    normalized.includes("property") ||
    normalized.includes("real")
  ) {
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

export const BottomTabInset = 96;
export const MaxContentWidth = 960;
