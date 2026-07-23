import { StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import type { ReportBarItem } from "../../utils/reportCalculations";

type Props = {
  title: string;
  data: ReportBarItem[];
};

export default function ReportBarChart({ title, data }: Props) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Current offline CRM data</Text>

      <View style={styles.list}>
        {data.map((item) => {
          const width = Math.max((item.value / maxValue) * 100, item.value > 0 ? 4 : 0);
          return (
            <View key={item.label} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={styles.label}>{item.label}</Text>
                <Text style={styles.value}>{item.displayValue}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.bar, { width: `${width}%` }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  title: { color: COLORS.white, fontSize: 17, fontWeight: "900" },
  subtitle: { marginTop: 3, color: COLORS.textMuted, fontSize: 11 },
  list: { marginTop: SPACING.lg, gap: SPACING.lg },
  row: { gap: SPACING.sm },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", gap: SPACING.md },
  label: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  value: { color: COLORS.textMuted, fontSize: 12, fontWeight: "700" },
  track: {
    height: 10,
    overflow: "hidden",
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceLight,
  },
  bar: { height: "100%", borderRadius: RADIUS.round, backgroundColor: COLORS.primary },
});
