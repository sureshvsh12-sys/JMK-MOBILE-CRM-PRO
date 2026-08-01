import { StyleSheet, Text, View } from "react-native";

import { COLORS, RADIUS } from "../constants/theme";

export type StatusTone = "blue" | "green" | "red" | "amber" | "purple" | "slate" | "finance" | "assets" | "solar";

type StatusBadgeProps = { label: string; tone?: StatusTone; solid?: boolean };

const TONES: Record<StatusTone, string> = {
  blue: "#2563EB",
  green: "#16A34A",
  red: "#DC2626",
  amber: "#F59E0B",
  purple: "#7C3AED",
  slate: "#475569",
  finance: COLORS.finance,
  assets: COLORS.assets,
  solar: COLORS.solar,
};

export default function StatusBadge({ label, tone = "slate", solid = true }: StatusBadgeProps) {
  const color = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: solid ? color : `${color}16`, borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: solid ? COLORS.white : color }]} />
      <Text style={[styles.text, { color: solid ? COLORS.white : color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 6, borderRadius: RADIUS.round, borderWidth: 1 },
  dot: { width: 5, height: 5, marginRight: 5, borderRadius: 3 },
  text: { fontSize: 9, fontWeight: "900" },
});
