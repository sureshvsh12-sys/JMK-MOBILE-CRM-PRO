import { useRouter, type Href } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  COLORS,
  RADIUS,
  SPACING,
} from "../constants/theme";

type DrawerItem = {
  title: string;
  icon: string;
  route: Href;
};

const ITEMS: readonly DrawerItem[] = [
  { title: "Dashboard", icon: "🏠", route: "/dashboard" },
  { title: "Leads", icon: "🎯", route: "/leads" },
  { title: "Customers", icon: "👥", route: "/customers" },
  { title: "Follow-ups", icon: "📅", route: "/followups" },
  { title: "Bookings", icon: "📝", route: "/bookings" },
  { title: "Finance", icon: "₹", route: "/finance" },
  { title: "Solar", icon: "☀️", route: "/solar" },
  { title: "Employees", icon: "🧑‍💼", route: "/employees" },
  { title: "Reports", icon: "📊", route: "/reports" },
  { title: "Search", icon: "🔎", route: "/search" },
  { title: "Notifications", icon: "🔔", route: "/notifications" },
  { title: "Settings", icon: "⚙️", route: "/settings" },
];

type AppDrawerProps = {
  onNavigate?: () => void;
};

export default function AppDrawer({ onNavigate }: AppDrawerProps) {
  const router = useRouter();

  function navigateTo(route: Href) {
    onNavigate?.();
    router.push(route);
  }

  return (
    <View style={styles.container}>
      <View style={styles.brandSection}>
        <Text style={styles.brandName}>JMK GROUP</Text>
        <Text style={styles.brandTagline}>Trust • Growth • Future</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.itemsContainer}
        showsVerticalScrollIndicator={false}
      >
        {ITEMS.map((item) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.title}`}
            key={item.title}
            onPress={() => navigateTo(item.route)}
            style={({ pressed }) => [
              styles.item,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  brandSection: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brandName: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  brandTagline: {
    marginTop: SPACING.xs,
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  itemsContainer: {
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  item: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  icon: {
    width: 30,
    fontSize: 17,
  },
  title: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },
  chevron: {
    color: COLORS.textMuted,
    fontSize: 24,
    fontWeight: "400",
  },
  pressed: {
    opacity: 0.7,
  },
});
