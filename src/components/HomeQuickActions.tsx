import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, RADIUS, SPACING } from "../constants/theme";

type HomeAction = {
  title: string;
  subtitle: string;
  icon: string;
  route: Href;
  accentColor: string;
};

const ACTIONS: readonly HomeAction[] = [
  {
    title: "Global Search",
    subtitle: "Find every CRM record",
    icon: "⌕",
    route: "/search",
    accentColor: "#60A5FA",
  },
  {
    title: "Team",
    subtitle: "Employees and access",
    icon: "♟",
    route: "/employees",
    accentColor: "#A78BFA",
  },
  {
    title: "Reports",
    subtitle: "Business performance",
    icon: "▥",
    route: "/reports",
    accentColor: "#34D399",
  },
  {
    title: "Alerts",
    subtitle: "Notifications center",
    icon: "◈",
    route: "/notifications",
    accentColor: "#F59E0B",
  },
  {
    title: "Settings",
    subtitle: "CRM preferences",
    icon: "⚙",
    route: "/settings",
    accentColor: "#94A3B8",
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
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: `${action.accentColor}1D`,
                borderColor: `${action.accentColor}45`,
              },
            ]}
          >
            <Text style={[styles.icon, { color: action.accentColor }]}>
              {action.icon}
            </Text>
          </View>

          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={1}>
              {action.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {action.subtitle}
            </Text>
          </View>

          <Text style={[styles.chevron, { color: action.accentColor }]}>›</Text>
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
    minWidth: 156,
    flexGrow: 1,
    flexBasis: "46%",
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(13,27,45,0.92)",
  },
  iconContainer: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  icon: {
    fontSize: 22,
    fontWeight: "900",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "600",
  },
  chevron: {
    marginLeft: SPACING.sm,
    fontSize: 23,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.975 }],
  },
});
