import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, RADIUS } from "../constants/theme";
import {
  getUnreadNotificationCount,
  subscribeToNotificationChanges,
} from "../storage/notificationStorage";

type NotificationBellProps = {
  count?: number;
  onPress?: () => void;
};

export default function NotificationBell({
  count,
  onPress,
}: NotificationBellProps) {
  const [storedCount, setStoredCount] = useState(0);

  const loadCount = useCallback(async () => {
    setStoredCount(await getUnreadNotificationCount());
  }, []);

  useEffect(() => {
    void loadCount();
    return subscribeToNotificationChanges(() => {
      void loadCount();
    });
  }, [loadCount]);

  const requestedCount = Number.isFinite(count)
    ? Math.max(0, Math.floor(count ?? 0))
    : 0;
  const safeCount = Math.max(requestedCount, storedCount);

  return (
    <Pressable
      accessibilityLabel={
        safeCount > 0
          ? `${safeCount} unread notifications`
          : "Notifications"
      }
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.bell}>🔔</Text>

      {safeCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {safeCount > 99 ? "99+" : safeCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bell: {
    marginTop: -1,
    fontSize: 20,
    lineHeight: 24,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: "#07182A",
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
});
