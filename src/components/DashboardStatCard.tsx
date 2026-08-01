import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS, RADIUS, SHADOW, SPACING } from "../constants/theme";

type DashboardStatCardProps = {
  title: string;
  value: string | number;
  icon: string;
  accentColor?: string;
  description?: string;
  trend?: string;
  onPress?: () => void;
};

export default function DashboardStatCard({
  title,
  value,
  icon,
  accentColor = COLORS.primary,
  description,
  trend,
  onPress,
}: DashboardStatCardProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState<string | number>(
    typeof value === "number" ? 0 : value
  );

  useEffect(() => {
    if (typeof value !== "number") {
      setDisplayValue(value);
      return;
    }

    animatedValue.stopAnimation();
    animatedValue.setValue(0);

    const listenerId = animatedValue.addListener(({ value: nextValue }) => {
      setDisplayValue(Math.round(nextValue));
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration: 650,
      useNativeDriver: false,
    }).start();

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [animatedValue, value]);

  const content = (
    <>
      <View
        pointerEvents="none"
        style={[
          styles.glow,
          { backgroundColor: `${accentColor}18` },
        ]}
      />

      <View style={styles.topRow}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: `${accentColor}1F`,
              borderColor: `${accentColor}55`,
            },
          ]}
        >
          <Text style={styles.icon}>{icon}</Text>
        </View>

        <View style={styles.topMeta}>
          {trend ? (
            <View
              style={[
                styles.trendPill,
                { backgroundColor: `${accentColor}1A` },
              ]}
            >
              <Text style={[styles.trendText, { color: accentColor }]}>
                {trend}
              </Text>
            </View>
          ) : null}
          <View style={[styles.accentDot, { backgroundColor: accentColor }]} />
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        style={styles.value}
      >
        {displayValue}
      </Text>

      {description ? (
        <Text style={styles.description} numberOfLines={1}>
          {description}
        </Text>
      ) : null}

      <View style={[styles.bottomLine, { backgroundColor: accentColor }]} />
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${String(value)}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: "48.4%",
    minHeight: 158,
    padding: SPACING.lg,
    overflow: "hidden",
    borderRadius: RADIUS.xl,
    backgroundColor: "rgba(13,27,45,0.96)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.19)",
    ...SHADOW,
  },
  glow: {
    position: "absolute",
    top: -42,
    right: -32,
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topMeta: {
    alignItems: "flex-end",
    gap: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  icon: {
    fontSize: 21,
  },
  trendPill: {
    minHeight: 22,
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: RADIUS.round,
  },
  trendText: {
    fontSize: 9,
    fontWeight: "900",
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.round,
  },
  title: {
    marginTop: SPACING.md,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  value: {
    marginTop: 5,
    color: COLORS.white,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  description: {
    marginTop: 5,
    color: "#7F93A8",
    fontSize: 10,
    fontWeight: "600",
  },
  bottomLine: {
    position: "absolute",
    right: 16,
    bottom: 10,
    left: 16,
    height: 2,
    borderRadius: RADIUS.round,
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
