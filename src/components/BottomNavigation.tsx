import { usePathname, useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RADIUS, SHADOW } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";

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
    icon: "♙",
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
      "/settings",
      "/properties",
      "/property-details",
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
      "/raw-contacts",
    ],
  },
];

function matchesPath(pathname: string, paths: readonly string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export default function BottomNavigation({
  activeKey,
  onChange,
}: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();

  const resolvedActiveKey =
    activeKey ??
    ITEMS.find((item) => matchesPath(pathname, item.matchPaths))?.key ??
    "more";

  function handleNavigation(item: NavigationItem) {
    onChange?.(item.key);

    if (!matchesPath(pathname, item.matchPaths)) {
      router.replace(item.route);
    }
  }

  return (
    <View
      style={[
        styles.safeArea,
        {
          paddingBottom: Math.max(insets.bottom, 10),
          backgroundColor: palette.background,
        },
      ]}
    >
      <View
        accessibilityRole="tablist"
        style={[
          styles.container,
          {
            backgroundColor: palette.navigation,
            borderColor: palette.border,
          },
        ]}
      >
        {ITEMS.map((item) => {
          const active = item.key === resolvedActiveKey;

          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${item.title} tab`}
              onPress={() => handleNavigation(item)}
              style={({ pressed }) => [
                styles.item,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  active && {
                    backgroundColor: palette.primarySoft,
                    borderColor: palette.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.icon,
                    { color: palette.textMuted },
                    item.key === "more" && styles.moreIcon,
                    active && { color: palette.primary },
                  ]}
                >
                  {item.icon}
                </Text>
              </View>

              <Text
                numberOfLines={1}
                style={[
                  styles.title,
                  { color: palette.textMuted },
                  active && { color: palette.text },
                ]}
              >
                {item.title}
              </Text>

              {active ? (
                <View
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: palette.primary },
                  ]}
                />
              ) : null}
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
  },
  container: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 25,
    borderWidth: 1,
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
    borderWidth: 1,
    borderColor: "transparent",
  },
  icon: {
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 24,
  },
  moreIcon: {
    fontSize: 16,
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "800",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 1,
    width: 22,
    height: 3,
    borderRadius: 99,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
});
