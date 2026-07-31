import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";

import AppHeader from "../../components/AppHeader";
import ReportBarChart from "../../components/reports/ReportBarChart";
import ReportKpiCard from "../../components/reports/ReportKpiCard";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { getReportsSummary } from "../../services/reportsService";
import {
  calculateReportsSummary,
  createBusinessMix,
  createPipelineMix,
  formatCurrency,
} from "../../utils/reportCalculations";

const MODULE_ROUTES = {
  rawContacts: "/raw-contacts",
  leads: "/leads",
  customers: "/customers",
  followups: "/followups",
  finance: "/finance",
  bookings: "/bookings",
  solar: "/solar",
} satisfies Record<string, Href>;

const EMPTY_SUMMARY = calculateReportsSummary([], [], [], [], [], [], []);

export default function ReportsDashboardScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReports = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError("");

    try {
      setSummary(await getReportsSummary());
    } catch (loadError) {
      console.error("Unable to load reports:", loadError);
      setError("Reports refresh nahi ho sake. Local CRM data dobara check karein.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadReports();
    }, [loadReports])
  );

  const businessMix = useMemo(() => createBusinessMix(summary), [summary]);
  const pipelineMix = useMemo(() => createPipelineMix(summary), [summary]);

  return (
    <View style={styles.page}>
      <AppHeader segment="Enterprise Reports" onMenuPress={() => router.back()} />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Preparing reports...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadReports(true)}
              tintColor={COLORS.primary}
            />
          }
        >
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>JMK CRM PRO ENTERPRISE</Text>
            <Text style={styles.title}>Business Reports</Text>
            <Text style={styles.description}>
              Raw Contacts se Customer conversion, follow-ups aur business value ka combined offline report.
            </Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.sectionTitle}>Sales Pipeline</Text>
          <View style={styles.grid}>
            <ReportKpiCard label="Raw Contacts" value={String(summary.rawContacts)} caption={`${summary.interestedRawContacts} interested`} icon="☎" />
            <ReportKpiCard label="Active Leads" value={String(summary.activeLeads)} caption={`${summary.leads} total leads`} icon="🎯" />
            <ReportKpiCard label="Customers" value={String(summary.customers)} caption={`${summary.conversionRate.toFixed(1)}% conversion`} icon="👥" />
            <ReportKpiCard label="Follow-ups" value={String(summary.pendingFollowUps)} caption={`${summary.overdueFollowUps} overdue`} icon="⏰" />
          </View>

          <ReportBarChart title="Raw Contact → Customer Pipeline" data={pipelineMix} />

          <Text style={styles.sectionTitle}>Segment Performance</Text>
          <View style={styles.segmentList}>
            {summary.segments.map((item) => (
              <View key={item.segment} style={styles.segmentCard}>
                <Text style={styles.segmentName}>{item.segment}</Text>
                <SummaryRow label="Raw Contacts" value={String(item.rawContacts)} />
                <SummaryRow label="Leads" value={String(item.leads)} />
                <SummaryRow label="Customers" value={String(item.customers)} />
                <SummaryRow label="Lead Value" value={formatCurrency(item.leadValue)} last />
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Business Value</Text>
          <View style={styles.grid}>
            <ReportKpiCard label="Bookings" value={String(summary.bookings)} caption={formatCurrency(summary.bookingValue)} icon="🏠" />
            <ReportKpiCard label="Total Income" value={formatCurrency(summary.income)} caption={`${formatCurrency(summary.expense)} expense`} icon="₹" />
            <ReportKpiCard label="Solar Projects" value={String(summary.solarProjects)} caption={`${summary.solarCapacityKw.toLocaleString("en-IN")} kW capacity`} icon="☀" />
            <ReportKpiCard label="Due Today" value={String(summary.dueTodayFollowUps)} caption="Pending follow-ups" icon="📅" />
          </View>

          <ReportBarChart title="Business Value Mix" data={businessMix} />

          <Text style={styles.sectionTitle}>Collection & Balance</Text>
          <View style={styles.detailCard}>
            <SummaryRow label="Booking received" value={formatCurrency(summary.bookingReceived)} />
            <SummaryRow label="Booking pending" value={formatCurrency(summary.bookingBalance)} />
            <SummaryRow label="Finance net balance" value={formatCurrency(summary.netBalance)} />
            <SummaryRow label="Solar project value" value={formatCurrency(summary.solarValue)} />
            <SummaryRow label="Solar pending balance" value={formatCurrency(summary.solarBalance)} last />
          </View>

          <Text style={styles.sectionTitle}>Open Modules</Text>
          <View style={styles.actions}>
            <ModuleButton label="Raw Contacts" onPress={() => router.push(MODULE_ROUTES.rawContacts)} />
            <ModuleButton label="Leads" onPress={() => router.push(MODULE_ROUTES.leads)} />
            <ModuleButton label="Customers" onPress={() => router.push(MODULE_ROUTES.customers)} />
            <ModuleButton label="Follow-ups" onPress={() => router.push(MODULE_ROUTES.followups)} />
            <ModuleButton label="Finance" onPress={() => router.push(MODULE_ROUTES.finance)} />
            <ModuleButton label="Bookings" onPress={() => router.push(MODULE_ROUTES.bookings)} />
            <ModuleButton label="Solar" onPress={() => router.push(MODULE_ROUTES.solar)} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function SummaryRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.summaryRow, last && styles.summaryRowLast]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function ModuleButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
      <Text style={styles.actionText}>{label}</Text>
      <Text style={styles.actionArrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  content: { width: "100%", maxWidth: 960, alignSelf: "center", padding: SPACING.lg, paddingBottom: 110, gap: SPACING.lg },
  loader: { flex: 1, alignItems: "center", justifyContent: "center", gap: SPACING.md },
  loaderText: { color: COLORS.textMuted, fontWeight: "700" },
  hero: { padding: SPACING.xl, borderRadius: RADIUS.xl, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  eyebrow: { color: COLORS.primary, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  title: { marginTop: SPACING.sm, color: COLORS.white, fontSize: 28, fontWeight: "900" },
  description: { marginTop: SPACING.sm, color: COLORS.textMuted, fontSize: 13, lineHeight: 20 },
  error: { padding: SPACING.md, borderRadius: RADIUS.md, color: COLORS.danger, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.danger, fontWeight: "700" },
  sectionTitle: { marginTop: SPACING.sm, color: COLORS.white, fontSize: 17, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.md },
  segmentList: { gap: SPACING.md },
  segmentCard: { paddingHorizontal: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  segmentName: { paddingVertical: SPACING.md, color: COLORS.primary, fontSize: 16, fontWeight: "900", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailCard: { paddingHorizontal: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  summaryRow: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  summaryRowLast: { borderBottomWidth: 0 },
  summaryLabel: { flex: 1, color: COLORS.textMuted, fontSize: 13, fontWeight: "700" },
  summaryValue: { color: COLORS.white, fontSize: 14, fontWeight: "900" },
  actions: { gap: SPACING.sm },
  actionButton: { minHeight: 54, paddingHorizontal: SPACING.lg, flexDirection: "row", alignItems: "center", borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  actionText: { flex: 1, color: COLORS.white, fontSize: 14, fontWeight: "800" },
  actionArrow: { color: COLORS.primary, fontSize: 28, fontWeight: "700" },
  pressed: { opacity: 0.7 },
});
