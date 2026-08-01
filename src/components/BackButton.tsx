import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { RADIUS, SHADOW, SPACING } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";

type BackButtonProps = {
  label?: string;
  fallbackRoute?: string;
  onPress?: () => void;
  compact?: boolean;
};

export default function BackButton({
  label = "Back",
  fallbackRoute = "/dashboard",
  onPress,
  compact = false,
}: BackButtonProps) {
  const router = useRouter();
  const { palette } = useAppTheme();

  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackRoute as never);
  }

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={8}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compactButton,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          compact && styles.compactIconContainer,
          { backgroundColor: palette.primarySoft },
        ]}
      >
        <Text
          style={[
            styles.icon,
            compact && styles.compactIcon,
            { color: palette.text },
          ]}
        >
          ‹
        </Text>
      </View>

      <Text
        numberOfLines={1}
        style={[
          styles.label,
          compact && styles.compactLabel,
          { color: palette.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    ...SHADOW,
  },
  compactButton: {
    minHeight: 38,
    paddingLeft: 6,
    paddingRight: 10,
    paddingVertical: 5,
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
    borderRadius: RADIUS.round,
  },
  compactIconContainer: {
    width: 24,
    height: 24,
    marginRight: 5,
  },
  icon: {
    marginTop: -2,
    fontSize: 27,
    fontWeight: "800",
    lineHeight: 29,
  },
  compactIcon: {
    fontSize: 23,
    lineHeight: 25,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
  },
  compactLabel: {
    fontSize: 12,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
});
