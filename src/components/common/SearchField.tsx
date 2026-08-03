import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { RADIUS, SPACING } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
};

export default function SearchField({ value, onChangeText, placeholder }: SearchFieldProps) {
  const { palette } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.icon, { color: palette.textMuted }]}>⌕</Text>
      <TextInput
        accessibilityLabel="Search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.textMuted}
        selectionColor={palette.primary}
        cursorColor={palette.primary}
        style={[styles.input, { color: palette.text }]}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onChangeText("")}
          style={({ pressed }) => [
            styles.clearButton,
            { backgroundColor: palette.surfaceSoft },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.clearText, { color: palette.text }]}>×</Text>
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
    borderWidth: 1,
  },
  icon: { width: 28, fontSize: 24, lineHeight: 26 },
  input: { flex: 1, minHeight: 50, fontSize: 13 },
  clearButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
  },
  clearText: { marginTop: -2, fontSize: 22, fontWeight: "500" },
  pressed: { opacity: 0.7 },
});
