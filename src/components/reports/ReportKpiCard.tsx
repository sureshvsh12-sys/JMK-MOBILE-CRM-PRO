import { StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";

type Props = {
  label: string;
  value: string;
  caption?: string;
  icon?: string;
  accentColor?: string;
  progress?: number;
};

function clampProgress(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value ?? 0, 0), 100);
}

export default function ReportKpiCard({
  label,
  value,
  caption,
  icon = "●",
  accentColor = COLORS.primary,
  progress,
}: Props) {
  const safeProgress = clampProgress(progress);

  return (
    <View style={[styles.card, { borderColor: `${accentColor}48` }]}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: accentColor, shadowColor: accentColor },
          ]}
        >
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${accentColor}12` }]}>
          <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
          <Text style={[styles.statusText, { color: accentColor }]}>LIVE</Text>
        </View>
      </View>

      <Text style={styles.label}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={styles.value}>
        {value}
      </Text>

      {caption ? (
        <Text numberOfLines={2} style={styles.caption}>
          {caption}
        </Text>
      ) : null}

      {progress !== undefined ? (
        <View style={styles.progressArea}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Performance</Text>
            <Text style={[styles.progressValue, { color: accentColor }]}>
              {safeProgress.toFixed(0)}%
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${safeProgress}%`, backgroundColor: accentColor },
              ]}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    overflow: "hidden",
    flexGrow: 1,
    flexBasis: 170,
    minHeight: 190,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    backgroundColor: COLORS.surface,
    ...SHADOW,
  },
  accentBar: { position: "absolute", top: 0, left: 0, right: 0, height: 4 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 9,
    elevation: 4,
  },
  icon: { color: COLORS.white, fontSize: 19, fontWeight: "900" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 8.5, fontWeight: "900", letterSpacing: 0.6 },
  label: {
    marginTop: SPACING.md,
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  value: { marginTop: SPACING.xs, color: COLORS.text, fontSize: 25, fontWeight: "900" },
  caption: {
    minHeight: 32,
    marginTop: SPACING.xs,
    color: COLORS.textSoft,
    fontSize: 10.5,
    fontWeight: "600",
    lineHeight: 16,
  },
  progressArea: { marginTop: SPACING.md },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", gap: SPACING.sm },
  progressLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: "700" },
  progressValue: { fontSize: 9, fontWeight: "900" },
  progressTrack: {
    height: 6,
    marginTop: 6,
    overflow: "hidden",
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceLight,
  },
  progressFill: { height: "100%", borderRadius: RADIUS.round },
});
