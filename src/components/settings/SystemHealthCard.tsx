import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import {
  runAppHealthCheck,
  type AppHealthReport,
  type HealthStatus,
} from "../../services/appHealth";

const STATUS_LABELS: Record<HealthStatus, string> = {
  healthy: "Ready",
  warning: "Attention",
  error: "Problem",
};

const STATUS_SYMBOLS: Record<HealthStatus, string> = {
  healthy: "✓",
  warning: "!",
  error: "×",
};

const STATUS_COLORS: Record<HealthStatus, string> = {
  healthy: COLORS.success,
  warning: COLORS.warning,
  error: COLORS.danger,
};

function formatCheckedAt(value: string | undefined) {
  if (!value) return "Not checked yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Checked recently";

  return `Checked ${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function SystemHealthCard() {
  const [report, setReport] = useState<AppHealthReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");

  const checkHealth = useCallback(async () => {
    if (checking) return;

    setChecking(true);
    setCheckError("");

    try {
      setReport(await runAppHealthCheck());
    } catch (reason) {
      setCheckError(
        reason instanceof Error
          ? reason.message
          : "Health check complete nahi ho saka."
      );
    } finally {
      setChecking(false);
    }
  }, [checking]);

  useEffect(() => {
    void checkHealth();
    // The first health check should run once when this card mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const checks = report?.checks ?? [];
    return {
      healthy: checks.filter((item) => item.status === "healthy").length,
      warning: checks.filter((item) => item.status === "warning").length,
      error: checks.filter((item) => item.status === "error").length,
      total: checks.length,
    };
  }, [report]);

  const overallStatus = report?.overallStatus ?? "warning";
  const overallColor = STATUS_COLORS[overallStatus];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headingBlock}>
          <Text style={styles.eyebrow}>SYSTEM STATUS</Text>
          <Text style={styles.title}>Production Health Check</Text>
          <Text style={styles.subtitle}>
            Version {report?.appVersion ?? "1.0.0"} • {formatCheckedAt(report?.checkedAt)}
          </Text>
        </View>

        <View
          style={[
            styles.overallBadge,
            { borderColor: `${overallColor}66`, backgroundColor: `${overallColor}18` },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: overallColor }]} />
          <Text style={[styles.overallText, { color: overallColor }]}>
            {report ? STATUS_LABELS[report.overallStatus] : "Checking"}
          </Text>
        </View>
      </View>

      {report ? (
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>
              {summary.healthy}
            </Text>
            <Text style={styles.summaryLabel}>Healthy</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: COLORS.warning }]}>
              {summary.warning}
            </Text>
            <Text style={styles.summaryLabel}>Warnings</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: COLORS.danger }]}>
              {summary.error}
            </Text>
            <Text style={styles.summaryLabel}>Errors</Text>
          </View>
        </View>
      ) : null}

      {checking && !report ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>Checking app services...</Text>
        </View>
      ) : (
        <View style={styles.checkList}>
          {report?.checks.map((check) => {
            const color = STATUS_COLORS[check.status];
            return (
              <View key={check.id} style={styles.checkRow}>
                <View
                  style={[
                    styles.statusIconWrap,
                    { backgroundColor: `${color}18`, borderColor: `${color}44` },
                  ]}
                >
                  <Text style={[styles.statusIcon, { color }]}>
                    {STATUS_SYMBOLS[check.status]}
                  </Text>
                </View>
                <View style={styles.checkText}>
                  <View style={styles.checkTitleRow}>
                    <Text style={styles.checkLabel}>{check.label}</Text>
                    <Text style={[styles.checkStatus, { color }]}>
                      {STATUS_LABELS[check.status]}
                    </Text>
                  </View>
                  <Text style={styles.checkDetail}>{check.detail}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {checkError ? <Text style={styles.errorText}>{checkError}</Text> : null}

      <Pressable
        accessibilityRole="button"
        disabled={checking}
        onPress={() => void checkHealth()}
        style={({ pressed }) => [
          styles.button,
          checking && styles.buttonDisabled,
          pressed && !checking && styles.buttonPressed,
        ]}
      >
        {checking ? <ActivityIndicator size="small" color={COLORS.white} /> : null}
        <Text style={styles.buttonText}>
          {checking ? "Checking..." : "Run Health Check"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: SPACING.lg,
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
  headingBlock: { flex: 1 },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  title: {
    marginTop: 5,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 5,
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 15,
  },
  overallBadge: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.round,
    borderWidth: 1,
  },
  statusDot: { width: 7, height: 7, borderRadius: RADIUS.round },
  overallText: { fontSize: 10, fontWeight: "900" },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 20, fontWeight: "900" },
  summaryLabel: {
    marginTop: 2,
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },
  summaryDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
  loadingBox: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  loadingText: { color: COLORS.textMuted, fontSize: 11 },
  checkList: { marginTop: SPACING.md, gap: SPACING.sm },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    backgroundColor: COLORS.background,
  },
  statusIconWrap: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
    borderWidth: 1,
  },
  statusIcon: { fontSize: 17, fontWeight: "900" },
  checkText: { flex: 1 },
  checkTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  checkLabel: { flex: 1, color: COLORS.text, fontSize: 12, fontWeight: "800" },
  checkStatus: { fontSize: 9, fontWeight: "900" },
  checkDetail: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 15,
  },
  errorText: {
    marginTop: SPACING.md,
    color: COLORS.danger,
    fontSize: 11,
    lineHeight: 16,
  },
  button: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
  },
  buttonDisabled: { opacity: 0.72 },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  buttonText: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
});
