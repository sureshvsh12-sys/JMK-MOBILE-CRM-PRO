import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import { COLORS, RADIUS, SHADOW, SPACING } from "../constants/theme";

export type AppButtonVariant =
  | "primary"
  | "secondary"
  | "call"
  | "whatsapp"
  | "success"
  | "warning"
  | "callback"
  | "danger"
  | "finance"
  | "assets"
  | "solar";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

const VARIANT_COLORS: Record<AppButtonVariant, string> = {
  primary: COLORS.primary,
  secondary: COLORS.navy,
  call: "#2563EB",
  whatsapp: "#16A34A",
  success: COLORS.success,
  warning: "#F59E0B",
  callback: "#7C3AED",
  danger: COLORS.danger,
  finance: COLORS.finance,
  assets: COLORS.assets,
  solar: COLORS.solar,
};

export default function AppButton({
  label,
  onPress,
  variant = "primary",
  icon,
  loading = false,
  disabled = false,
  compact = false,
  fullWidth = false,
  style,
}: AppButtonProps) {
  const color = VARIANT_COLORS[variant];
  const blocked = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked }}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        fullWidth && styles.fullWidth,
        { backgroundColor: color, borderColor: color },
        pressed && !blocked && styles.pressed,
        blocked && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text numberOfLines={1} style={styles.label}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    ...SHADOW,
  },
  compact: { minHeight: 38, paddingHorizontal: SPACING.md, borderRadius: RADIUS.sm },
  fullWidth: { width: "100%" },
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  icon: { marginRight: SPACING.sm },
  label: { color: COLORS.white, fontSize: 12, fontWeight: "900", letterSpacing: 0.1 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.5, shadowOpacity: 0, elevation: 0 },
});
