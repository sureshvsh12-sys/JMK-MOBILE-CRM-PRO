import { usePathname, useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS, RADIUS } from "../constants/theme";

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
  matchPaths: readonly string[];
};

type BottomNavigationProps = {
  activeKey?: BottomNavigationKey;
  onChange?: (key: BottomNavigationKey) => void;
};

const ITEMS: readonly NavigationItem[] = [
  {
    key: "dashboard",
    title: "Home",
    icon: "⌂",
    route: "/dashboard",
    matchPaths: ["/dashboard"],
  },
  {
    key: "leads",
    title: "Leads",
    icon: "◎",
    route: "/leads",
    matchPaths: ["/leads", "/lead-form"],
  },
  {
    key: "customers",
    title: "Customers",
    icon: "♟",
    route: "/customers",
    matchPaths: [
      "/customers",
      "/customer-form",
      "/customer-360",
      "/customer-documents",
    ],
  },
  {
    key: "followups",
    title: "Follow-ups",
    icon: "✓",
    route: "/followups",
    matchPaths: ["/followups", "/followup-form"],
  },
  {
    key: "more",
    title: "More",
    icon: "•••",
    route: "/settings",
    matchPaths: [
      "/settings",
      "/bookings",
      "/booking-form",
      "/booking-payments",
      "/booking-payment-form",
      "/booking-installments",
      "/booking-installment-form",
      "/finance",
      "/finance-entry",
      "/solar",
      "/solar-form",
      "/employees",
      "/reports",
      "/search",
      "/notifications",
    ],
  },
];

function matchesPath(pathname: string, paths: readonly string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export default function BottomNavigation({
  activeKey,
  onChange,
}: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const resolvedActiveKey =
    activeKey ??
    ITEMS.find((item) => matchesPath(pathname, item.matchPaths))?.key;

  function handleNavigation(item: NavigationItem) {
    onChange?.(item.key);

    if (!matchesPath(pathname, item.matchPaths)) {
      router.replace(item.route);
    }
  }

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.safeContainer,
        { paddingBottom: Math.max(insets.bottom, 7) },
      ]}
    >
      <View style={styles.container}>
        {ITEMS.map((item) => {
          const active = item.key === resolvedActiveKey;

          return (
            <Pressable
              accessibilityRole="tab"
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
              <View
                style={[
                  styles.iconContainer,
                  active && styles.activeIconContainer,
                ]}
              >
                <Text
                  style={[
                    styles.icon,
                    item.key === "more" && styles.moreIcon,
                    active && styles.activeIcon,
                  ]}
                >
                  {item.icon}
                </Text>
              </View>

              <Text
                numberOfLines={1}
                style={[styles.title, active && styles.activeTitle]}
              >
                {item.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    backgroundColor: "#051321",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  container: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingTop: 6,
  },
  item: {
    flex: 1,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeItem: {
    backgroundColor: COLORS.primarySoft,
    borderColor: "rgba(248,113,113,0.32)",
  },
  iconContainer: {
    minWidth: 40,
    height: 29,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
  },
  activeIconContainer: {
    backgroundColor: "rgba(220,38,38,0.16)",
  },
  icon: {
    color: "#9FB0C3",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 25,
  },
  moreIcon: {
    fontSize: 17,
    letterSpacing: 1,
  },
  activeIcon: {
    color: "#FF6268",
  },
  title: {
    marginTop: 1,
    color: "#8FA3B7",
    fontSize: 9.5,
    fontWeight: "700",
  },
  activeTitle: {
    color: COLORS.white,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
});
