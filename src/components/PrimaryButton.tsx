import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
} from "react-native";

import {
    COLORS,
    RADIUS,
    SHADOW,
} from "../constants/theme";

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.disabled,
        pressed &&
          !isDisabled &&
          styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={COLORS.white}
        />
      ) : (
        <Text style={styles.title}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    ...SHADOW,
  },

  title: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  pressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  disabled: {
    opacity: 0.5,
  },
});