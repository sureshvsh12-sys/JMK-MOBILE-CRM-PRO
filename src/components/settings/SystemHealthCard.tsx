import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { runAppHealthCheck, type AppHealthReport, type HealthStatus } from "../../services/appHealth";

const STATUS_LABELS: Record<HealthStatus, string> = {
  healthy: "Ready",
  warning: "Attention",
  error: "Problem",
};

export default function SystemHealthCard() {
  const [report, setReport] = useState<AppHealthReport | null>(null);
  const [checking, setChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    setChecking(true);
    try {
      setReport(await runAppHealthCheck());
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Production Health Check</Text>
          <Text style={styles.subtitle}>Version {report?.appVersion ?? "1.0.0"}</Text>
        </View>
        <View style={styles.overallBadge}>
          <Text style={styles.overallText}>
            {report ? STATUS_LABELS[report.overallStatus] : "Checking"}
          </Text>
        </View>
      </View>

      {checking && !report ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : (
        <View style={styles.checkList}>
          {report?.checks.map((check) => (
            <View key={check.id} style={styles.checkRow}>
              <Text style={styles.statusIcon}>
                {check.status === "healthy" ? "✓" : check.status === "warning" ? "!" : "×"}
              </Text>
              <View style={styles.checkText}>
                <Text style={styles.checkLabel}>{check.label}</Text>
                <Text style={styles.checkDetail}>{check.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Pressable style={styles.button} disabled={checking} onPress={() => void checkHealth()}>
        <Text style={styles.buttonText}>{checking ? "Checking..." : "Run Health Check"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  overallBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceLight,
  },
  overallText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
  },
  loader: {
    marginVertical: SPACING.xl,
  },
  checkList: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },
  statusIcon: {
    width: 26,
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "900",
  },
  checkText: {
    flex: 1,
  },
  checkLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  checkDetail: {
    marginTop: 2,
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 15,
  },
  button: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
  },
});
