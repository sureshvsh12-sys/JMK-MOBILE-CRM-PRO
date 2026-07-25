import { usePathname, useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS, RADIUS, SPACING } from "../constants/theme";

const HEADER_LOGO = require("../../assets/images/jmk-logo-dark.png");
const ROOT_PATHS = new Set(["/dashboard", "/leads", "/customers", "/followups"]);

type AppHeaderProps = {
  userName?: string;
  segment?: string;
  notificationCount?: number;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
};

export default function AppHeader({
  userName = "Suresh Vishwakarma",
  segment = "JMK CRM PRO Enterprise",
  notificationCount = 0,
  onMenuPress,
  onNotificationPress,
  onProfilePress,
  showBackButton,
  onBackPress,
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const initials =
    userName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase() || "SV";

  const safeNotificationCount = Number.isFinite(notificationCount)
    ? Math.max(0, Math.floor(notificationCount))
    : 0;

  const shouldShowBack =
    showBackButton ?? (!ROOT_PATHS.has(pathname) && pathname !== "/settings");

  function handleLeadingPress() {
    if (!shouldShowBack) {
      onMenuPress?.();
      return;
    }

    if (onBackPress) {
      onBackPress();
      return;
    }

    if (router.canGoBack()) router.back();
    else router.replace("/dashboard");
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityLabel={shouldShowBack ? "Go back" : "Open menu"}
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleLeadingPress}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Text style={shouldShowBack ? styles.backIcon : styles.menuIcon}>
            {shouldShowBack ? "‹" : "☰"}
          </Text>
        </Pressable>

        <View style={styles.titleContainer}>
          <View style={styles.brandRow}>
            <Image source={HEADER_LOGO} resizeMode="contain" style={styles.brandLogo} />
            <Text style={styles.groupText}>GROUP</Text>
          </View>
          <Text style={styles.segment} numberOfLines={1}>{segment}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityLabel={safeNotificationCount ? `${safeNotificationCount} unread notifications` : "Notifications"}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onNotificationPress}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Text style={styles.bellIcon}>♢</Text>
            <View style={styles.bellDot} />
            {safeNotificationCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{safeNotificationCount > 99 ? "99+" : safeNotificationCount}</Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable
            accessibilityLabel={`Open ${userName} profile`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onProfilePress}
            style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}
          >
            <Text style={styles.profileText}>{initials}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#07182A",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRow: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingBottom: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuIcon: { color: COLORS.white, fontSize: 22, fontWeight: "900", lineHeight: 25 },
  backIcon: { marginTop: -3, color: COLORS.white, fontSize: 38, fontWeight: "300", lineHeight: 40 },
  titleContainer: { flex: 1, minWidth: 0, marginHorizontal: SPACING.md },
  brandRow: { minHeight: 27, flexDirection: "row", alignItems: "center" },
  brandLogo: { width: 78, height: 27 },
  groupText: { marginLeft: 6, color: COLORS.white, fontSize: 16, fontWeight: "900", letterSpacing: 1.5 },
  segment: { marginTop: 2, color: COLORS.textMuted, fontSize: 10.5, fontWeight: "700", letterSpacing: 0.15 },
  actions: { flexDirection: "row", alignItems: "center", gap: 7 },
  bellIcon: { color: COLORS.white, fontSize: 22, fontWeight: "900", transform: [{ rotate: "45deg" }] },
  bellDot: { position: "absolute", top: 10, width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.white },
  badge: {
    position: "absolute", top: -4, right: -4, minWidth: 18, height: 18,
    paddingHorizontal: 4, alignItems: "center", justifyContent: "center",
    borderRadius: RADIUS.round, backgroundColor: COLORS.primary,
    borderWidth: 1.5, borderColor: "#07182A",
  },
  badgeText: { color: COLORS.white, fontSize: 9, fontWeight: "900" },
  profileButton: {
    width: 42, height: 42, alignItems: "center", justifyContent: "center",
    borderRadius: RADIUS.round, backgroundColor: COLORS.primary,
    borderWidth: 2, borderColor: "#F87171",
  },
  profileText: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
});
