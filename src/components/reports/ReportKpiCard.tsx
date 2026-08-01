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
    <View style={[styles.card, { borderColor: `${accentColor}55` }]}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${accentColor}1F` }]}>
          <Text style={[styles.icon, { color: accentColor }]}>{icon}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
      </View>

      <Text style={styles.label}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={styles.value}>
        {value}
      </Text>

      {!!caption && (
        <Text numberOfLines={2} style={styles.caption}>
          {caption}
        </Text>
      )}

      {progress !== undefined ? (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${safeProgress}%`, backgroundColor: accentColor },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 158,
    minHeight: 162,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    backgroundColor: COLORS.surface,
    ...SHADOW,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
  },
  icon: { fontSize: 18, fontWeight: "900" },
  statusDot: { width: 7, height: 7, borderRadius: RADIUS.round },
  label: {
    marginTop: SPACING.md,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
  value: {
    marginTop: SPACING.xs,
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "900",
  },
  caption: {
    minHeight: 30,
    marginTop: SPACING.xs,
    color: COLORS.textSoft,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
  },
  progressTrack: {
    height: 5,
    marginTop: SPACING.md,
    overflow: "hidden",
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceLight,
  },
  progressFill: { height: "100%", borderRadius: RADIUS.round },
});
