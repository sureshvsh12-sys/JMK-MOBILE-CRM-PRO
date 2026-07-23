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
import { getBookings } from "../../storage/bookingStorage";
import { getCustomers } from "../../storage/customerStorage";
import { getFinanceEntries } from "../../storage/financeStorage";
import { getSolarProjects } from "../../storage/solarStorage";
import {
  calculateReportsSummary,
  createBusinessMix,
  formatCurrency,
} from "../../utils/reportCalculations";

const MODULE_ROUTES = {
  finance: "/finance",
  bookings: "/bookings",
  solar: "/solar",
  customers: "/customers",
} satisfies Record<string, Href>;

const EMPTY_SUMMARY = calculateReportsSummary([], [], [], []);

export default function ReportsDashboardScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const [customers, bookings, financeEntries, solarProjects] = await Promise.all([
        getCustomers(),
        getBookings(),
        getFinanceEntries(),
        getSolarProjects(),
      ]);
      setSummary(calculateReportsSummary(customers, bookings, financeEntries, solarProjects));
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
              Finance, Assets and Solar ka live offline summary ek hi dashboard par.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Key Performance</Text>
          <View style={styles.grid}>
            <ReportKpiCard label="Customers" value={String(summary.customers)} caption="Total CRM customers" icon="👥" />
            <ReportKpiCard label="Bookings" value={String(summary.bookings)} caption={formatCurrency(summary.bookingValue)} icon="🏠" />
            <ReportKpiCard label="Total Income" value={formatCurrency(summary.income)} caption={`${summary.expense ? formatCurrency(summary.expense) : "₹0"} expense`} icon="₹" />
            <ReportKpiCard label="Solar Projects" value={String(summary.solarProjects)} caption={`${summary.solarCapacityKw.toLocaleString("en-IN")} kW capacity`} icon="☀" />
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
            <ModuleButton label="Finance" onPress={() => router.push(MODULE_ROUTES.finance)} />
            <ModuleButton label="Bookings" onPress={() => router.push(MODULE_ROUTES.bookings)} />
            <ModuleButton label="Solar" onPress={() => router.push(MODULE_ROUTES.solar)} />
            <ModuleButton label="Customers" onPress={() => router.push(MODULE_ROUTES.customers)} />
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
  sectionTitle: { marginTop: SPACING.sm, color: COLORS.white, fontSize: 17, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.md },
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
