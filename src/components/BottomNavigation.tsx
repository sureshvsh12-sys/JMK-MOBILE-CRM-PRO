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

export type BottomNavigationKey =
  | "dashboard"
  | "leads"
  | "customers"
  | "followups"
  | "more";

type NavigationItem = {
  key: BottomNavigationKey;
  title: string;
  icon: string;
  route: Href;
};

type BottomNavigationProps = {
  activeKey: BottomNavigationKey;
  onChange?: (key: BottomNavigationKey) => void;
};

const ITEMS: readonly NavigationItem[] = [
  {
    key: "dashboard",
    title: "Home",
    icon: "🏠",
    route: "/dashboard",
  },
  {
    key: "leads",
    title: "Leads",
    icon: "🎯",
    route: "/leads",
  },
  {
    key: "customers",
    title: "Customers",
    icon: "👥",
    route: "/customers",
  },
  {
    key: "followups",
    title: "Follow-ups",
    icon: "📅",
    route: "/followups",
  },
  {
    key: "more",
    title: "More",
    icon: "☰",
    route: "/settings",
  },
];

export default function BottomNavigation({
  activeKey,
  onChange,
}: BottomNavigationProps) {
  const router = useRouter();

  function handleNavigation(item: NavigationItem) {
    onChange?.(item.key);

    if (item.key !== activeKey) {
      router.replace(item.route);
    }
  }

  return (
    <View style={styles.container}>
      {ITEMS.map((item) => {
        const active = item.key === activeKey;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${item.title} tab`}
            key={item.key}
            onPress={() => handleNavigation(item)}
            style={({ pressed }) => [
              styles.item,
              active && styles.activeItem,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.icon,
                active && styles.activeIcon,
              ]}
            >
              {item.icon}
            </Text>

            <Text
              numberOfLines={1}
              style={[
                styles.title,
                active && styles.activeTitle,
              ]}
            >
              {item.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  item: {
    flex: 1,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
  },
  activeItem: {
    backgroundColor: "rgba(220, 38, 38, 0.13)",
  },
  icon: {
    fontSize: 18,
    opacity: 0.65,
  },
  activeIcon: {
    opacity: 1,
  },
  title: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },
  activeTitle: {
    color: COLORS.primary,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.65,
  },
});
