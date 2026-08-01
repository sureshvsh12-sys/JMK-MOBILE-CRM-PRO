import { ScrollView, Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, RADIUS, SHADOW, SPACING } from "../constants/theme";

export type SegmentFilterValue = "all" | "finance" | "assets" | "solar";

type SegmentFilterProps = {
  value: SegmentFilterValue;
  onChange: (value: SegmentFilterValue) => void;
};

const ITEMS: ReadonlyArray<{ key: SegmentFilterValue; label: string; color: string }> = [
  { key: "all", label: "All", color: "#475569" },
  { key: "finance", label: "Finance", color: COLORS.finance },
  { key: "assets", label: "Assets", color: COLORS.assets },
  { key: "solar", label: "Solar", color: COLORS.solar },
];

export default function SegmentFilter({ value, onChange }: SegmentFilterProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {ITEMS.map((item) => {
        const active = value === item.key;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.key)}
            style={({ pressed }) => [
              styles.chip,
              { backgroundColor: active ? item.color : `${item.color}16`, borderColor: item.color },
              active && styles.active,
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.dot, { backgroundColor: active ? COLORS.white : item.color }]} />
            <Text style={[styles.text, { color: active ? COLORS.white : item.color }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: SPACING.sm, paddingVertical: SPACING.xs },
  chip: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.round,
    borderWidth: 1,
  },
  active: { ...SHADOW },
  dot: { width: 7, height: 7, marginRight: 7, borderRadius: 4 },
  text: { fontSize: 11, fontWeight: "900" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
});
