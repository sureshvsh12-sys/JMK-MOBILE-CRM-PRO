import { Pressable, StyleSheet, Text, View } from "react-native";

import { RADIUS, SHADOW, SPACING } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";

type QuickActionCardProps = {
  title: string;
  subtitle?: string;
  icon: string;
  accentColor?: string;
  onPress: () => void;
};

export default function QuickActionCard({
  title,
  subtitle,
  icon,
  accentColor = "#2563EB",
  onPress,
}: QuickActionCardProps) {
  const { palette } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: `${accentColor}55`,
          shadowColor: palette.mode === "dark" ? "#000000" : "#64748B",
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: accentColor,
            shadowColor: accentColor,
          },
        ]}
      >
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: palette.text }]} numberOfLines={1}>
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: palette.textMuted }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.arrowCircle,
          {
            backgroundColor: accentColor,
            shadowColor: accentColor,
          },
        ]}
      >
        <Text style={styles.arrow}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    overflow: "hidden",
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    ...SHADOW,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  iconContainer: {
    width: 52,
    height: 52,
    marginLeft: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 5,
  },
  icon: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },
  content: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: SPACING.md,
  },
  title: {
    fontSize: 14,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  arrowCircle: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  arrow: {
    marginTop: -2,
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
