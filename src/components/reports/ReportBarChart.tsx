import { StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import type { ReportBarItem } from "../../utils/reportCalculations";

type Props = {
  title: string;
  subtitle?: string;
  data: ReportBarItem[];
  colors?: string[];
};

export default function ReportBarChart({
  title,
  subtitle = "Current CRM data",
  data,
  colors = [COLORS.primary, COLORS.info, COLORS.success],
}: Props) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalValue}>{total.toLocaleString("en-IN")}</Text>
          <Text style={styles.totalLabel}>TOTAL</Text>
        </View>
      </View>

      <View style={styles.list}>
        {data.map((item, index) => {
          const width = Math.max((item.value / maxValue) * 100, item.value > 0 ? 4 : 0);
          const color = colors[index % colors.length] ?? COLORS.primary;
          const share = total > 0 ? (item.value / total) * 100 : 0;

          return (
            <View key={item.label} style={styles.row}>
              <View style={styles.rowHeader}>
                <View style={styles.labelWrap}>
                  <View style={[styles.legendIcon, { backgroundColor: color }]}>
                    <Text style={styles.legendText}>{index + 1}</Text>
                  </View>
                  <View>
                    <Text style={styles.label}>{item.label}</Text>
                    <Text style={styles.share}>{share.toFixed(1)}% share</Text>
                  </View>
                </View>
                <Text style={styles.value}>{item.displayValue}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.bar, { width: `${width}%`, backgroundColor: color }]} />
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
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    ...SHADOW,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  headerText: { flex: 1 },
  title: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  subtitle: { marginTop: 4, color: COLORS.textMuted, fontSize: 11, lineHeight: 16 },
  totalBadge: {
    minWidth: 72,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: "#EEF4FA",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  totalValue: { color: COLORS.text, fontSize: 14, fontWeight: "900" },
  totalLabel: { marginTop: 2, color: COLORS.textMuted, fontSize: 8, fontWeight: "900" },
  list: { marginTop: SPACING.xl, gap: SPACING.lg },
  row: { gap: SPACING.sm },
  rowHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACING.md },
  labelWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  legendIcon: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.sm,
  },
  legendText: { color: COLORS.white, fontSize: 10, fontWeight: "900" },
  label: { color: COLORS.text, fontSize: 12.5, fontWeight: "900" },
  share: { marginTop: 2, color: COLORS.textMuted, fontSize: 9 },
  value: { color: COLORS.textSoft, fontSize: 12, fontWeight: "900" },
  track: {
    height: 11,
    overflow: "hidden",
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceLight,
  },
  bar: { height: "100%", borderRadius: RADIUS.round },
});
