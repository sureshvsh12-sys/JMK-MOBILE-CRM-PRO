import {
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    COLORS,
    RADIUS,
    SHADOW,
    SPACING,
} from "../constants/theme";

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

      <Text style={styles.title}>
        {title}
      </Text>

      <Text
        style={[
          styles.value,
          {
            color: accentColor,
          },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>

      {description ? (
        <Text
          style={styles.description}
          numberOfLines={1}
        >
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
    color: "#64748B",
    fontSize: 10,
    fontWeight: "600",
  },
});