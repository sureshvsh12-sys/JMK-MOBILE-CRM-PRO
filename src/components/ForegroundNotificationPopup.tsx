import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RADIUS, SHADOW } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";
import {
  getNotifications,
  markNotificationAsRead,
  subscribeToNotificationChanges,
  type AppNotification,
} from "../storage/notificationStorage";

const DISPLAY_DURATION = 6500;

function getModuleAccent(module: AppNotification["module"]): string {
  if (module === "Finance") return "#10B981";
  if (module === "Solar") return "#F97316";
  if (module === "Bookings" || module === "Raw Contacts") return "#D4A72C";
  if (module === "Follow-ups") return "#8B5CF6";
  if (module === "Customers") return "#0EA5E9";
  if (module === "Leads") return "#DC2626";
  return "#64748B";
}

function getModuleIcon(module: AppNotification["module"]): string {
  if (module === "Finance") return "₹";
  if (module === "Solar") return "☀";
  if (module === "Bookings") return "⌂";
  if (module === "Raw Contacts") return "☎";
  if (module === "Follow-ups") return "✓";
  if (module === "Customers") return "●";
  if (module === "Leads") return "◎";
  return "!";
}

export default function ForegroundNotificationPopup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette, resolvedTheme } = useAppTheme();
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const initializedRef = useRef(false);
  const latestKnownIdRef = useRef<string | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearHideTimer();
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.97,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setNotification(null);
    });
  }, [clearHideTimer, opacity, scale, translateY]);

  const show = useCallback(
    (nextNotification: AppNotification) => {
      clearHideTimer();
      setNotification(nextNotification);
      translateY.setValue(-150);
      opacity.setValue(0);
      scale.setValue(0.96);

      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            damping: 18,
            stiffness: 220,
            mass: 0.9,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });

      hideTimerRef.current = setTimeout(hide, DISPLAY_DURATION);
    },
    [clearHideTimer, hide, opacity, scale, translateY]
  );

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      const items = await getNotifications();
      if (!active) return;
      latestKnownIdRef.current = items[0]?.id ?? null;
      initializedRef.current = true;
    };

    void initialize();

    const unsubscribe = subscribeToNotificationChanges(() => {
      void (async () => {
        const items = await getNotifications();
        if (!active || !initializedRef.current) return;

        const latest = items[0];
        if (!latest || latest.id === latestKnownIdRef.current) return;

        latestKnownIdRef.current = latest.id;
        if (!latest.isRead) show(latest);
      })();
    });

    return () => {
      active = false;
      clearHideTimer();
      unsubscribe();
    };
  }, [clearHideTimer, show]);

  const openNotification = useCallback(async () => {
    if (!notification) return;

    await markNotificationAsRead(notification.id);
    const route = notification.route;
    hide();

    if (route) {
      router.push(route as Href);
    } else {
      router.push("/notifications");
    }
  }, [hide, notification, router]);

  if (!notification) return null;

  const accent = getModuleAccent(notification.module);
  const isLight = resolvedTheme === "light";

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, { paddingTop: Math.max(insets.top + 8, 16) }]}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: isLight ? "rgba(255,255,255,0.97)" : "rgba(13,27,45,0.97)",
            borderColor: isLight ? "rgba(15,23,42,0.10)" : "rgba(255,255,255,0.12)",
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <View style={[styles.accentLine, { backgroundColor: accent }]} />

        <Pressable
          accessibilityLabel={`Open ${notification.title}`}
          accessibilityRole="button"
          onPress={openNotification}
          style={({ pressed }) => [styles.content, pressed && styles.pressed]}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${accent}20` }]}> 
            <Text style={[styles.icon, { color: accent }]}>{getModuleIcon(notification.module)}</Text>
          </View>

          <View style={styles.textWrap}>
            <View style={styles.metaRow}>
              <Text style={[styles.module, { color: accent }]}>{notification.module}</Text>
              <View style={[styles.priorityDot, { backgroundColor: accent }]} />
              <Text style={[styles.now, { color: palette.textMuted }]}>Now</Text>
            </View>

            <Text numberOfLines={1} style={[styles.title, { color: palette.text }]}> 
              {notification.title}
            </Text>
            <Text numberOfLines={2} style={[styles.message, { color: palette.textMuted }]}> 
              {notification.message}
            </Text>
          </View>

          <Text style={[styles.chevron, { color: palette.textMuted }]}>›</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Dismiss notification"
          accessibilityRole="button"
          hitSlop={10}
          onPress={hide}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <Text style={[styles.closeText, { color: palette.textMuted }]}>×</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 620,
    minHeight: 92,
    overflow: "hidden",
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    ...SHADOW,
    shadowOpacity: Platform.OS === "ios" ? 0.24 : SHADOW.shadowOpacity,
  },
  accentLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 5,
  },
  content: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 42,
    paddingVertical: 13,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 23,
    fontWeight: "900",
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  module: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  priorityDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 7,
  },
  now: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  title: {
    fontSize: 14.5,
    fontWeight: "900",
    letterSpacing: -0.15,
  },
  message: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  chevron: {
    marginLeft: 8,
    fontSize: 28,
    fontWeight: "400",
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: RADIUS.round,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "500",
  },
  pressed: {
    opacity: 0.72,
  },
});
