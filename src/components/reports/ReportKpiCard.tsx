import { StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

type Props = {
  label: string;
  value: string;
  caption?: string;
  icon?: string;
};

export default function ReportKpiCard({ label, value, caption, icon = "●" }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.value}>
        {value}
      </Text>
      {!!caption && <Text style={styles.caption}>{caption}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 155,
    minHeight: 126,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  icon: { fontSize: 14, color: COLORS.primary },
  label: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  value: {
    marginTop: SPACING.md,
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
  },
  caption: {
    marginTop: SPACING.sm,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
});
