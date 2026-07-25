import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { COLORS, RADIUS, SPACING } from "../../constants/theme";

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
};

export default function SearchField({ value, onChangeText, placeholder }: SearchFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⌕</Text>
      <TextInput
        accessibilityLabel="Search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        style={styles.input}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onChangeText("")}
          style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
        >
          <Text style={styles.clearText}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  icon: { width: 28, color: COLORS.textMuted, fontSize: 24, lineHeight: 26 },
  input: { flex: 1, minHeight: 50, color: COLORS.text, fontSize: 13 },
  clearButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceLight,
  },
  clearText: { marginTop: -2, color: COLORS.text, fontSize: 22, fontWeight: "500" },
  pressed: { opacity: 0.7 },
});
