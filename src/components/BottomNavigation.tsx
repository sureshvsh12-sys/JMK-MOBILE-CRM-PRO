import { SymbolView } from "expo-symbols";
import { usePathname, useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS, RADIUS, SHADOW } from "../constants/theme";
import { useColorScheme } from "../hooks/use-color-scheme";

export type BottomNavigationKey =
  | "dashboard"
  | "leads"
  | "customers"
  | "followups"
  | "more";

type NavigationIcon = {
  ios: string;
  android: string;
  web: string;
};

type NavigationItem = {
  key: BottomNavigationKey;
  title: string;
  icon: NavigationIcon;
  route: Href;
  matchPaths: readonly string[];
};

type BottomNavigationProps = {
  activeKey?: BottomNavigationKey;
  onChange?: (key: BottomNavigationKey) => void;
  onNavigate?: (key: BottomNavigationKey) => void;
};

type NavigationButtonProps = {
  item: NavigationItem;
  active: boolean;
  dark: boolean;
  onPress: () => void;
};

const ITEMS: readonly NavigationItem[] = [
  {
    key: "dashboard",
    title: "Home",
    icon: { ios: "house.fill", android: "home", web: "home" },
    route: "/dashboard",
    matchPaths: ["/dashboard"],
  },
  {
    key: "leads",
    title: "Leads",
    icon: {
      ios: "person.crop.circle.badge.plus",
      android: "person_add",
      web: "person_add",
    },
    route: "/leads",
    matchPaths: ["/leads", "/lead-form"],
  },
  {
    key: "customers",
    title: "Customers",
    icon: { ios: "person.2.fill", android: "group", web: "group" },
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
    icon: {
      ios: "calendar.badge.clock",
      android: "event_repeat",
      web: "event_repeat",
    },
    route: "/followups",
    matchPaths: ["/followups", "/followup-form"],
  },
  {
    key: "more",
    title: "More",
    icon: {
      ios: "square.grid.2x2.fill",
      android: "apps",
      web: "apps",
    },
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
      "/raw-contacts",
    ],
  },
];

function matchesPath(pathname: string, paths: readonly string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function NavigationButton({
  item,
  active,
  dark,
  onPress,
}: NavigationButtonProps) {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: active ? 1 : 0,
      damping: 18,
      stiffness: 210,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [active, progress]);

  const animatedIconStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -3],
          }),
        },
        {
          scale: Animated.multiply(
            pressScale,
            progress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.08],
            })
          ),
        },
      ],
    }),
    [pressScale, progress]
  );

  const activePillStyle = useMemo(
    () => ({
      opacity: progress,
      transform: [
        {
          scaleX: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.58, 1],
          }),
        },
      ],
    }),
    [progress]
  );

  const indicatorStyle = useMemo(
    () => ({
      opacity: progress,
      transform: [
        {
          scaleX: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
        },
      ],
    }),
    [progress]
  );

  function animatePress(toValue: number) {
    Animated.spring(pressScale, {
      toValue,
      damping: 18,
      stiffness: 320,
      mass: 0.55,
      useNativeDriver: true,
    }).start();
  }

  const inactiveColor = dark ? "#91A4B8" : "#64748B";
  const titleColor = active
    ? dark
      ? COLORS.white
      : "#172033"
    : inactiveColor;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${item.title} tab`}
      hitSlop={4}
      onPress={onPress}
      onPressIn={() => animatePress(0.9)}
      onPressOut={() => animatePress(1)}
      style={styles.item}
    >
      <View style={styles.itemContent}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activePill,
            dark ? styles.activePillDark : styles.activePillLight,
            activePillStyle,
          ]}
        />

        <Animated.View style={[styles.iconWrap, animatedIconStyle]}>
          <SymbolView
            name={item.icon}
            size={23}
            weight={active ? "bold" : "medium"}
            tintColor={active ? COLORS.primary : inactiveColor}
          />
        </Animated.View>

        <Text numberOfLines={1} style={[styles.title, { color: titleColor }]}>
          {item.title}
        </Text>

        <Animated.View
          pointerEvents="none"
          style={[styles.activeIndicator, indicatorStyle]}
        />
      </View>
    </Pressable>
  );
}

export default function BottomNavigation({
  activeKey,
  onChange,
  onNavigate,
}: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const dark = colorScheme === "dark";

  const resolvedActiveKey =
    activeKey ??
    ITEMS.find((item) => matchesPath(pathname, item.matchPaths))?.key ??
    "more";

  function handleNavigation(item: NavigationItem) {
    onChange?.(item.key);
    onNavigate?.(item.key);

    if (!matchesPath(pathname, item.matchPaths)) {
      router.replace(item.route);
    }
  }

  const floatingBarStyle: ViewStyle = {
    backgroundColor: dark ? "rgba(7, 20, 34, 0.97)" : "rgba(255,255,255,0.98)",
    borderColor: dark ? "rgba(148,163,184,0.20)" : "rgba(15,23,42,0.10)",
  };

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.safeContainer,
        {
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      <View style={[styles.container, floatingBarStyle]}>
        <View
          pointerEvents="none"
          style={[
            styles.topHighlight,
            dark ? styles.topHighlightDark : styles.topHighlightLight,
          ]}
        />

        {ITEMS.map((item) => (
          <NavigationButton
            key={item.key}
            item={item}
            active={item.key === resolvedActiveKey}
            dark={dark}
            onPress={() => handleNavigation(item)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingTop: 7,
  },
  container: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 25,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 5,
    ...SHADOW,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    height: 1,
  },
  topHighlightDark: {
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  topHighlightLight: {
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  item: {
    flex: 1,
    minWidth: 0,
    minHeight: 60,
    borderRadius: RADIUS.xl,
  },
  itemContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: RADIUS.xl,
    paddingTop: 6,
    paddingBottom: 5,
  },
  activePill: {
    position: "absolute",
    top: 3,
    width: 52,
    height: 35,
    borderRadius: RADIUS.round,
    borderWidth: 1,
  },
  activePillDark: {
    backgroundColor: "rgba(220,38,38,0.16)",
    borderColor: "rgba(248,113,113,0.28)",
  },
  activePillLight: {
    backgroundColor: "rgba(220,38,38,0.09)",
    borderColor: "rgba(220,38,38,0.16)",
  },
  iconWrap: {
    width: 38,
    height: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 1,
    maxWidth: "100%",
    paddingHorizontal: 2,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.05,
    textAlign: "center",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 1,
    width: 18,
    height: 3,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
  },
});
