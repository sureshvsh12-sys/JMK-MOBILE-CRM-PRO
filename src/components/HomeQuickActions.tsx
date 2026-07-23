import { useRouter, type Href } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  COLORS,
  RADIUS,
  SPACING,
} from "../constants/theme";

type HomeAction = {
  title: string;
  icon: string;
  route: Href;
};

const ACTIONS: readonly HomeAction[] = [
  { title: "Search", icon: "🔎", route: "/search" },
  { title: "Employees", icon: "🧑‍💼", route: "/employees" },
  { title: "Reports", icon: "📊", route: "/reports" },
  { title: "Notifications", icon: "🔔", route: "/notifications" },
  { title: "Settings", icon: "⚙️", route: "/settings" },
];

export default function HomeQuickActions() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {ACTIONS.map((action) => (
        <Pressable
          accessibilityLabel={`Open ${action.title}`}
          accessibilityRole="button"
          key={action.title}
          onPress={() => router.push(action.route)}
          style={({ pressed }) => [
            styles.action,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.icon}>{action.icon}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {action.title}
          </Text>
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
    minWidth: 120,
    flexGrow: 1,
    flexBasis: "30%",
    minHeight: 82,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  icon: {
    fontSize: 22,
  },
  title: {
    marginTop: SPACING.sm,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});
