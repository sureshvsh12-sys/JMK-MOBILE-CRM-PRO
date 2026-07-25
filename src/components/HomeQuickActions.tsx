import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, RADIUS, SPACING } from "../constants/theme";

type HomeAction = {
  title: string;
  subtitle: string;
  icon: string;
  route: Href;
};

const ACTIONS: readonly HomeAction[] = [
  {
    title: "Search",
    subtitle: "Find CRM records",
    icon: "🔎",
    route: "/search",
  },
  {
    title: "Employees",
    subtitle: "Manage team",
    icon: "🧑‍💼",
    route: "/employees",
  },
  {
    title: "Reports",
    subtitle: "View performance",
    icon: "📊",
    route: "/reports",
  },
  {
    title: "Notifications",
    subtitle: "Review alerts",
    icon: "🔔",
    route: "/notifications",
  },
  {
    title: "Settings",
    subtitle: "Configure CRM",
    icon: "⚙️",
    route: "/settings",
  },
];

export default function HomeQuickActions() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {ACTIONS.map((action) => (
        <Pressable
          accessibilityLabel={`${action.title}. ${action.subtitle}`}
          accessibilityRole="button"
          key={action.title}
          onPress={() => router.push(action.route)}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{action.icon}</Text>
          </View>

          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={1}>
              {action.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {action.subtitle}
            </Text>
          </View>

          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },
  action: {
    minWidth: 150,
    flexGrow: 1,
    flexBasis: "46%",
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  iconContainer: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
  },
  icon: {
    fontSize: 21,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "600",
  },
  chevron: {
    marginLeft: SPACING.sm,
    color: COLORS.primary,
    fontSize: 23,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});
