import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

type EmptyStateProps = {
  icon?: string;
  title: string;
  message?: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export default function EmptyState({
  icon = "○",
  title,
  message,
  description,
  actionLabel,
  onActionPress,
}: EmptyStateProps) {
  const { palette } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.message, { color: palette.textMuted }]}>{message ?? description ?? ""}</Text>
      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onActionPress}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 300, alignItems: "center", justifyContent: "center", paddingHorizontal: SPACING.xl },
  iconBox: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  icon: { color: COLORS.primary, fontSize: 32, fontWeight: "900" },
  title: { marginTop: SPACING.lg, color: COLORS.text, fontSize: 18, fontWeight: "900", textAlign: "center" },
  message: { marginTop: 7, maxWidth: 280, color: COLORS.textMuted, fontSize: 12, lineHeight: 18, textAlign: "center" },
  button: { marginTop: SPACING.lg, paddingHorizontal: 18, paddingVertical: 11, borderRadius: RADIUS.md, backgroundColor: COLORS.primary },
  buttonText: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
