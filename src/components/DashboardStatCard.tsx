import { StyleSheet, Text, View } from "react-native";

import { COLORS, RADIUS, SHADOW, SPACING } from "../constants/theme";

type DashboardStatCardProps = {
  title: string;
  value: string | number;
  icon: string;
  accentColor?: string;
  description?: string;
};

export default function DashboardStatCard({
  title,
  value,
  icon,
  accentColor = COLORS.primary,
  description,
}: DashboardStatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: `${accentColor}22`,
              borderColor: `${accentColor}55`,
            },
          ]}
        >
          <Text style={styles.icon}>{icon}</Text>
        </View>

        <View style={[styles.accentDot, { backgroundColor: accentColor }]} />
      </View>

      <Text style={styles.title}>{title}</Text>

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={[styles.value, { color: accentColor }]}
      >
        {value}
      </Text>

      {description ? (
        <Text style={styles.description} numberOfLines={1}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48.3%",
    minHeight: 150,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  icon: {
    fontSize: 21,
  },
  accentDot: {
    width: 7,
    height: 7,
    borderRadius: RADIUS.round,
  },
  title: {
    marginTop: SPACING.md,
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  value: {
    marginTop: 5,
    fontSize: 23,
    fontWeight: "900",
  },
  description: {
    marginTop: 5,
    color: "#72859A",
    fontSize: 10,
    fontWeight: "600",
  },
});
