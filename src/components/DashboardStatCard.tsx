import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, RADIUS, SOFT_SHADOW, SPACING } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";

type DashboardStatCardProps = {
  title: string;
  value: string | number;
  icon: string;
  accentColor?: string;
  description?: string;
  trend?: string;
  onPress?: () => void;
};

export default function DashboardStatCard({
  title,
  value,
  icon,
  accentColor = COLORS.primary,
  description,
  trend,
  onPress,
}: DashboardStatCardProps) {
  const { palette } = useAppTheme();

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${title}: ${value}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          borderTopColor: accentColor,
          shadowColor: palette.mode === "dark" ? "#000000" : "#64748B",
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.glow, { backgroundColor: `${accentColor}12` }]} />

      <View style={styles.topRow}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: `${accentColor}14`,
              borderColor: `${accentColor}35`,
            },
          ]}
        >
          <Text style={[styles.icon, { color: accentColor }]}>{icon}</Text>
        </View>

        {trend ? (
          <View style={[styles.trendPill, { backgroundColor: `${accentColor}18` }]}>
            <Text style={[styles.trendText, { color: accentColor }]}>{trend}</Text>
          </View>
        ) : (
          <View style={[styles.accentDot, { backgroundColor: accentColor }]} />
        )}
      </View>

      <Text style={[styles.title, { color: palette.textMuted }]}>
        {title.toUpperCase()}
      </Text>

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={[styles.value, { color: palette.text }]}
      >
        {value}
      </Text>

      {description ? (
        <Text
          style={[styles.description, { color: palette.textMuted }]}
          numberOfLines={1}
        >
          {description}
        </Text>
      ) : null}

      <View style={[styles.accentLine, { backgroundColor: accentColor }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48.3%",
    minHeight: 158,
    padding: SPACING.lg,
    overflow: "hidden",
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderTopWidth: 3,
    ...SOFT_SHADOW,
  },
  glow: {
    position: "absolute",
    top: -52,
    right: -45,
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  icon: {
    fontSize: 21,
    fontWeight: "900",
  },
  trendPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
  },
  trendText: {
    fontSize: 9,
    fontWeight: "900",
  },
  accentDot: {
    width: 7,
    height: 7,
    borderRadius: RADIUS.round,
  },
  title: {
    marginTop: SPACING.md,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.45,
  },
  value: {
    marginTop: 5,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  description: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: "600",
  },
  accentLine: {
    position: "absolute",
    left: SPACING.lg,
    right: SPACING.lg,
    bottom: 9,
    height: 2,
    borderRadius: RADIUS.round,
    opacity: 0.8,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
