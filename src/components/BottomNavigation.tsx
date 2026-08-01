import { usePathname, useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS, RADIUS, SHADOW } from "../constants/theme";

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
  { key: "dashboard", title: "Home", icon: "⌂", route: "/dashboard", matchPaths: ["/dashboard"] },
  { key: "leads", title: "Leads", icon: "♙", route: "/leads", matchPaths: ["/leads", "/lead-form"] },
  {
    key: "customers",
    title: "Customers",
    icon: "♟",
    route: "/customers",
    matchPaths: ["/customers", "/customer-form", "/customer-360", "/customer-documents"],
  },
  {
    key: "followups",
    title: "Follow-ups",
    icon: "◷",
    route: "/followups",
    matchPaths: ["/followups", "/followup-form"],
  },
  {
    key: "more",
    title: "More",
    icon: "•••",
    route: "/settings",
    matchPaths: [
      "/settings", "/bookings", "/booking-form", "/booking-payments",
      "/booking-payment-form", "/booking-installments", "/booking-installment-form",
      "/finance", "/finance-entry", "/solar", "/solar-form", "/employees",
      "/reports", "/search", "/notifications", "/raw-contacts",
    ],
  },
];

function matchesPath(pathname: string, paths: readonly string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default function BottomNavigation({ activeKey, onChange }: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const resolvedActiveKey = activeKey ?? ITEMS.find((item) => matchesPath(pathname, item.matchPaths))?.key;

  function handleNavigation(item: NavigationItem) {
    onChange?.(item.key);
    if (!matchesPath(pathname, item.matchPaths)) router.replace(item.route);
  }

  return (
    <View style={[styles.safeArea, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View accessibilityRole="tablist" style={styles.container}>
        {ITEMS.map((item) => {
          const active = item.key === resolvedActiveKey;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${item.title} tab`}
              onPress={() => handleNavigation(item)}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <View style={[styles.iconContainer, active && styles.activeIconContainer]}>
                <Text style={[styles.icon, item.key === "more" && styles.moreIcon, active && styles.activeIcon]}>
                  {item.icon}
                </Text>
              </View>
              <Text numberOfLines={1} style={[styles.title, active && styles.activeTitle]}>
                {item.title}
              </Text>
              {active ? <View style={styles.activeIndicator} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: "transparent",
  },
  container: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderWidth: 1,
    borderColor: "#D9E4EF",
    ...SHADOW,
  },
  item: {
    flex: 1,
    minHeight: 57,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
    borderRadius: RADIUS.lg,
  },
  iconContainer: {
    minWidth: 40,
    height: 31,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
  },
  activeIconContainer: {
    minWidth: 48,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(227,38,46,0.18)",
  },
  icon: {
    color: "#718499",
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 24,
  },
  moreIcon: {
    fontSize: 16,
    letterSpacing: 1.5,
  },
  activeIcon: {
    color: COLORS.primary,
  },
  title: {
    marginTop: 2,
    color: "#718499",
    fontSize: 9,
    fontWeight: "700",
  },
  activeTitle: {
    color: COLORS.navy,
    fontWeight: "900",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 1,
    width: 18,
    height: 3,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
});
