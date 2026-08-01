import { usePathname, useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RADIUS, SPACING } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";
import NotificationBell from "./NotificationBell";

const HEADER_LOGO_DARK = require("../../assets/images/jmk-logo-dark.png");
const HEADER_LOGO_LIGHT = require("../../assets/images/jmk-logo-light.png");
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
  const { palette, resolvedTheme } = useAppTheme();

  const initials = userName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase() || "SV";
  const safeNotificationCount = Number.isFinite(notificationCount) ? Math.max(0, Math.floor(notificationCount)) : 0;
  const shouldShowBack = showBackButton ?? (!ROOT_PATHS.has(pathname) && pathname !== "/settings");

  function handleLeadingPress() {
    if (!shouldShowBack) return onMenuPress?.();
    if (onBackPress) return onBackPress();
    if (router.canGoBack()) router.back();
    else router.replace("/dashboard");
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 8), backgroundColor: palette.header, borderBottomColor: palette.border }]}> 
      <View style={styles.colorLine}>
        <View style={[styles.colorPart, { backgroundColor: palette.finance }]} />
        <View style={[styles.colorPart, { backgroundColor: palette.assets }]} />
        <View style={[styles.colorPart, { backgroundColor: palette.solar }]} />
      </View>
      <View style={styles.headerRow}>
        <Pressable accessibilityLabel={shouldShowBack ? "Go back" : "Open menu"} accessibilityRole="button" hitSlop={8} onPress={handleLeadingPress} style={({ pressed }) => [styles.iconButton, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }, pressed && styles.pressed]}>
          <Text style={[shouldShowBack ? styles.backIcon : styles.menuIcon, { color: palette.text }]}>{shouldShowBack ? "‹" : "☰"}</Text>
        </Pressable>
        <View style={styles.titleContainer}>
          <View style={styles.brandRow}>
            <Image
              source={resolvedTheme === "light" ? HEADER_LOGO_LIGHT : HEADER_LOGO_DARK}
              resizeMode="contain"
              style={styles.brandLogo}
            />
            <Text style={[styles.groupText, { color: palette.text }]}>GROUP</Text>
          </View>
          <Text style={[styles.segment, { color: palette.textMuted }]} numberOfLines={1}>{segment}</Text>
        </View>
        <View style={styles.actions}>
          <NotificationBell count={safeNotificationCount} onPress={onNotificationPress} />
          <Pressable accessibilityLabel={`Open ${userName} profile`} accessibilityRole="button" hitSlop={8} onPress={onProfilePress} style={({ pressed }) => [styles.profileButton, { backgroundColor: palette.primary, borderColor: `${palette.primary}88` }, pressed && styles.pressed]}>
            <Text style={styles.profileText}>{initials}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderBottomWidth: 1 },
  colorLine: { position: "absolute", left: 0, right: 0, bottom: 0, height: 3, flexDirection: "row" },
  colorPart: { flex: 1 },
  headerRow: { minHeight: 66, flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.md, paddingBottom: 10 },
  iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.md, borderWidth: 1 },
  menuIcon: { fontSize: 22, fontWeight: "900", lineHeight: 25 },
  backIcon: { marginTop: -3, fontSize: 38, fontWeight: "300", lineHeight: 40 },
  titleContainer: { flex: 1, minWidth: 0, marginHorizontal: SPACING.md },
  brandRow: { minHeight: 27, flexDirection: "row", alignItems: "center" },
  brandLogo: { width: 78, height: 27 },
  groupText: { marginLeft: 6, fontSize: 16, fontWeight: "900", letterSpacing: 1.5 },
  segment: { marginTop: 2, fontSize: 10.5, fontWeight: "700", letterSpacing: 0.15 },
  actions: { flexDirection: "row", alignItems: "center", gap: 7 },
  profileButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.round, borderWidth: 2 },
  profileText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
});
