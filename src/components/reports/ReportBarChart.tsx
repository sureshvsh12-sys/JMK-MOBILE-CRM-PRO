import { StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
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

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.list}>
        {data.map((item, index) => {
          const width = Math.max((item.value / maxValue) * 100, item.value > 0 ? 4 : 0);
          const color = colors[index % colors.length] ?? COLORS.primary;

          return (
            <View key={item.label} style={styles.row}>
              <View style={styles.rowHeader}>
                <View style={styles.labelWrap}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={styles.label}>{item.label}</Text>
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
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  headerText: { flex: 1 },
  title: { color: COLORS.white, fontSize: 17, fontWeight: "900" },
  subtitle: { marginTop: 4, color: COLORS.textMuted, fontSize: 11, lineHeight: 16 },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(22,163,74,0.12)",
  },
  liveDot: { width: 6, height: 6, borderRadius: RADIUS.round, backgroundColor: COLORS.success },
  liveText: { color: COLORS.success, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  list: { marginTop: SPACING.xl, gap: SPACING.lg },
  row: { gap: SPACING.sm },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", gap: SPACING.md },
  labelWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  legendDot: { width: 8, height: 8, borderRadius: RADIUS.round },
  label: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  value: { color: COLORS.textSoft, fontSize: 12, fontWeight: "800" },
  track: {
    height: 12,
    overflow: "hidden",
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceLight,
  },
  bar: { height: "100%", borderRadius: RADIUS.round },
});
