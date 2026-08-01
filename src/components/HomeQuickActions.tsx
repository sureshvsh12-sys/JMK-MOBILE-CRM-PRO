import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { RADIUS, SHADOW, SPACING } from "../constants/theme";

type HomeAction = {
  title: string;
  subtitle: string;
  icon: string;
  route: Href;
  accentColor: string;
  softColor: string;
};

const ACTIONS: readonly HomeAction[] = [
  {
    title: "Global Search",
    subtitle: "Find every CRM record",
    icon: "⌕",
    route: "/search",
    accentColor: "#2563EB",
    softColor: "#EFF6FF",
  },
  {
    title: "Team",
    subtitle: "Employees and access",
    icon: "♟",
    route: "/employees",
    accentColor: "#7C3AED",
    softColor: "#F5F3FF",
  },
  {
    title: "Reports",
    subtitle: "Business performance",
    icon: "▥",
    route: "/reports",
    accentColor: "#059669",
    softColor: "#ECFDF5",
  },
  {
    title: "Alerts",
    subtitle: "Notifications center",
    icon: "◈",
    route: "/notifications",
    accentColor: "#F59E0B",
    softColor: "#FFFBEB",
  },
  {
    title: "Settings",
    subtitle: "CRM preferences",
    icon: "⚙",
    route: "/settings",
    accentColor: "#0EA5E9",
    softColor: "#F0F9FF",
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
          style={({ pressed }) => [
            styles.action,
            {
              backgroundColor: action.softColor,
              borderColor: `${action.accentColor}3D`,
            },
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.accentBar, { backgroundColor: action.accentColor }]} />

          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: action.accentColor,
                shadowColor: action.accentColor,
              },
            ]}
          >
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

          <View
            style={[
              styles.chevronCircle,
              {
                backgroundColor: action.accentColor,
                shadowColor: action.accentColor,
              },
            ]}
          >
            <Text style={styles.chevron}>›</Text>
          </View>
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
    position: "relative",
    minWidth: 156,
    flexGrow: 1,
    flexBasis: "46%",
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    overflow: "hidden",
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
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
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 3,
    marginRight: SPACING.md,
    borderRadius: RADIUS.md,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: "#102033",
    fontSize: 13.5,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 4,
    color: "#61758A",
    fontSize: 10.5,
    fontWeight: "600",
  },
  chevronCircle: {
    width: 34,
    height: 34,
    marginLeft: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 4,
  },
  chevron: {
    marginTop: -2,
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 26,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
});