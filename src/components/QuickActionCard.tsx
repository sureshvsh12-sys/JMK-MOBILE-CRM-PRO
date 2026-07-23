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

type QuickActionCardProps = {
  title: string;
  subtitle?: string;
  icon: string;
  accentColor?: string;
  onPress: () => void;
};

export default function QuickActionCard({
  title,
  subtitle,
  icon,
  accentColor = COLORS.primary,
  onPress,
}: QuickActionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: `${accentColor}20`,
            borderColor: `${accentColor}50`,
          },
        ]}
      >
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={styles.subtitle}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <Text
        style={[
          styles.arrow,
          {
            color: accentColor,
          },
        ]}
      >
        ›
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  iconContainer: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },

  icon: {
    fontSize: 22,
  },

  content: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },

  title: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "500",
  },

  arrow: {
    fontSize: 28,
    fontWeight: "400",
  },

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },
});