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

type AppHeaderProps = {
  userName?: string;
  segment?: string;
  notificationCount?: number;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
};

export default function AppHeader({
  userName = "Suresh Vishwakarma",
  segment = "JMK Group",
  notificationCount = 0,
  onMenuPress,
  onNotificationPress,
  onProfilePress,
}: AppHeaderProps) {
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  const safeNotificationCount = Math.max(
    0,
    Math.floor(notificationCount)
  );

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Open enterprise menu"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onMenuPress}
        style={({ pressed }) => [
          styles.iconButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.menuIcon}>☰</Text>
      </Pressable>

      <View style={styles.titleContainer}>
        <Text style={styles.brandName} numberOfLines={1}>
          JMK GROUP
        </Text>
        <Text style={styles.segment} numberOfLines={1}>
          {segment}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={
            safeNotificationCount > 0
              ? `Open notifications, ${safeNotificationCount} unread`
              : "Open notifications"
          }
          accessibilityRole="button"
          hitSlop={8}
          onPress={onNotificationPress}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.notificationIcon}>🔔</Text>

          {safeNotificationCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {safeNotificationCount > 9
                  ? "9+"
                  : safeNotificationCount}
              </Text>
            </View>
          ) : null}
        </Pressable>

        <Pressable
          accessibilityLabel="Open profile settings"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onProfilePress}
          style={({ pressed }) => [
            styles.profileButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.profileText}>
            {initials || "SV"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
  },
  menuIcon: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: "800",
  },
  notificationIcon: {
    fontSize: 19,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  brandName: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  segment: {
    marginTop: 2,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  badge: {
    position: "absolute",
    top: 3,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: COLORS.primary,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "900",
  },
  profileButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  profileText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
});
