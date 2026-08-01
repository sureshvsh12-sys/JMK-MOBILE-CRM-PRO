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

import AppButton from "../../components/AppButton";
import AppHeader from "../../components/AppHeader";
import ReportBarChart from "../../components/reports/ReportBarChart";
import ReportKpiCard from "../../components/reports/ReportKpiCard";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import { getReportsSummary } from "../../services/reportsService";
import {
  calculateReportsSummary,
  createBusinessMix,
  createPipelineMix,
  formatCurrency,
  type SegmentReport,
} from "../../utils/reportCalculations";

const FINANCE = "#10B981";
const ASSETS = "#D4A72C";
const SOLAR = "#F97316";

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

function percentage(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.max((value / total) * 100, 0), 100);
}

function segmentColor(segment: SegmentReport["segment"]): string {
  if (segment === "Finance") return FINANCE;
  if (segment === "Solar") return SOLAR;
  return ASSETS;
}

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
  const rawToLeadRate = percentage(summary.leads, summary.rawContacts);
  const collectionRate = percentage(summary.bookingReceived, summary.bookingValue);
  const solarCollectionRate = percentage(
    Math.max(summary.solarValue - summary.solarBalance, 0),
    summary.solarValue
  );

  return (
    <View style={styles.page}>
      <AppHeader segment="Enterprise Analytics" onMenuPress={() => router.back()} />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Preparing enterprise analytics...</Text>
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
            <View style={styles.heroGlowOne} />
            <View style={styles.heroGlowTwo} />
            <Text style={styles.eyebrow}>JMK CRM PRO ENTERPRISE</Text>
            <Text style={styles.title}>Business Analytics</Text>
            <Text style={styles.description}>
              Finance, Assets aur Solar ka live performance snapshot — Raw Contacts se Customer conversion tak.
            </Text>
            <View style={styles.heroMetrics}>
              <HeroMetric label="Conversion" value={`${summary.conversionRate.toFixed(1)}%`} />
              <HeroMetric label="Net Balance" value={formatCurrency(summary.netBalance)} />
              <HeroMetric label="Due Today" value={String(summary.dueTodayFollowUps)} />
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <SectionTitle title="Pipeline Health" subtitle="Raw Contact → Lead → Customer" />
          <View style={styles.grid}>
            <ReportKpiCard
              label="Raw Contacts"
              value={String(summary.rawContacts)}
              caption={`${summary.interestedRawContacts} interested contacts`}
              icon="☎"
              accentColor={ASSETS}
              progress={percentage(summary.interestedRawContacts, summary.rawContacts)}
            />
            <ReportKpiCard
              label="Active Leads"
              value={String(summary.activeLeads)}
              caption={`${summary.leads} total leads`}
              icon="◎"
              accentColor={FINANCE}
              progress={rawToLeadRate}
            />
            <ReportKpiCard
              label="Customers"
              value={String(summary.customers)}
              caption={`${summary.convertedLeads} converted leads`}
              icon="👥"
              accentColor={COLORS.info}
              progress={summary.conversionRate}
            />
            <ReportKpiCard
              label="Follow-ups"
              value={String(summary.pendingFollowUps)}
              caption={`${summary.overdueFollowUps} overdue • ${summary.dueTodayFollowUps} today`}
              icon="◷"
              accentColor={summary.overdueFollowUps > 0 ? COLORS.danger : COLORS.success}
              progress={percentage(summary.dueTodayFollowUps, summary.pendingFollowUps)}
            />
          </View>

          <ReportBarChart
            title="Conversion Funnel"
            subtitle="Current volume across the CRM lifecycle"
            data={pipelineMix}
            colors={[ASSETS, FINANCE, COLORS.info]}
          />

          <SectionTitle title="Segment Performance" subtitle="Independent Finance, Assets and Solar pipelines" />
          <View style={styles.segmentList}>
            {summary.segments.map((item) => (
              <SegmentCard key={item.segment} item={item} />
            ))}
          </View>

          <SectionTitle title="Revenue & Collections" subtitle="Business value and outstanding balance" />
          <View style={styles.grid}>
            <ReportKpiCard
              label="Finance Net"
              value={formatCurrency(summary.netBalance)}
              caption={`${formatCurrency(summary.income)} income • ${formatCurrency(summary.expense)} expense`}
              icon="₹"
              accentColor={FINANCE}
              progress={percentage(summary.netBalance, summary.income)}
            />
            <ReportKpiCard
              label="Assets Bookings"
              value={formatCurrency(summary.bookingValue)}
              caption={`${formatCurrency(summary.bookingBalance)} pending`}
              icon="⌂"
              accentColor={ASSETS}
              progress={collectionRate}
            />
            <ReportKpiCard
              label="Solar Value"
              value={formatCurrency(summary.solarValue)}
              caption={`${summary.solarCapacityKw.toLocaleString("en-IN")} kW • ${formatCurrency(summary.solarBalance)} pending`}
              icon="☀"
              accentColor={SOLAR}
              progress={solarCollectionRate}
            />
          </View>

          <ReportBarChart
            title="Business Value Mix"
            subtitle="Segment-wise monetary value"
            data={businessMix}
            colors={[ASSETS, FINANCE, SOLAR]}
          />

          <View style={styles.collectionCard}>
            <Text style={styles.collectionTitle}>Collection Summary</Text>
            <CollectionRow
              label="Assets collection"
              value={formatCurrency(summary.bookingReceived)}
              total={formatCurrency(summary.bookingValue)}
              progress={collectionRate}
              color={ASSETS}
            />
            <CollectionRow
              label="Solar collection"
              value={formatCurrency(Math.max(summary.solarValue - summary.solarBalance, 0))}
              total={formatCurrency(summary.solarValue)}
              progress={solarCollectionRate}
              color={SOLAR}
            />
          </View>

          <SectionTitle title="Open Modules" subtitle="Drill down into source records" />
          <View style={styles.actions}>
            <ModuleButton label="Raw Contacts" accentColor={ASSETS} onPress={() => router.push(MODULE_ROUTES.rawContacts)} />
            <ModuleButton label="Leads" accentColor={FINANCE} onPress={() => router.push(MODULE_ROUTES.leads)} />
            <ModuleButton label="Customers" accentColor={COLORS.info} onPress={() => router.push(MODULE_ROUTES.customers)} />
            <ModuleButton label="Follow-ups" accentColor={COLORS.warning} onPress={() => router.push(MODULE_ROUTES.followups)} />
            <ModuleButton label="Finance" accentColor={FINANCE} onPress={() => router.push(MODULE_ROUTES.finance)} />
            <ModuleButton label="Bookings" accentColor={ASSETS} onPress={() => router.push(MODULE_ROUTES.bookings)} />
            <ModuleButton label="Solar" accentColor={SOLAR} onPress={() => router.push(MODULE_ROUTES.solar)} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroMetric}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.heroMetricValue}>{value}</Text>
      <Text style={styles.heroMetricLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function SegmentCard({ item }: { item: SegmentReport }) {
  const color = segmentColor(item.segment);
  const leadRate = percentage(item.leads, item.rawContacts);
  const customerRate = percentage(item.customers, item.leads);

  return (
    <View style={[styles.segmentCard, { borderColor: `${color}66` }]}>
      <View style={styles.segmentHeader}>
        <View>
          <Text style={[styles.segmentName, { color }]}>{item.segment}</Text>
          <Text style={styles.segmentCaption}>Independent business pipeline</Text>
        </View>
        <View style={[styles.segmentBadge, { backgroundColor: `${color}1F` }]}>
          <Text style={[styles.segmentBadgeText, { color }]}>{customerRate.toFixed(0)}%</Text>
        </View>
      </View>
      <View style={styles.segmentMetrics}>
        <MiniMetric label="Raw" value={String(item.rawContacts)} />
        <MiniMetric label="Leads" value={String(item.leads)} />
        <MiniMetric label="Customers" value={String(item.customers)} />
        <MiniMetric label="Lead Value" value={formatCurrency(item.leadValue)} />
      </View>
      <View style={styles.segmentProgressRow}>
        <Text style={styles.segmentProgressLabel}>Raw to Lead</Text>
        <Text style={[styles.segmentProgressValue, { color }]}>{leadRate.toFixed(1)}%</Text>
      </View>
      <View style={styles.segmentTrack}>
        <View style={[styles.segmentFill, { width: `${leadRate}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniMetric}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.miniMetricValue}>{value}</Text>
      <Text style={styles.miniMetricLabel}>{label}</Text>
    </View>
  );
}

function CollectionRow({
  label,
  value,
  total,
  progress,
  color,
}: {
  label: string;
  value: string;
  total: string;
  progress: number;
  color: string;
}) {
  return (
    <View style={styles.collectionRow}>
      <View style={styles.collectionHeader}>
        <Text style={styles.collectionLabel}>{label}</Text>
        <Text style={[styles.collectionPercent, { color }]}>{progress.toFixed(1)}%</Text>
      </View>
      <Text style={styles.collectionValue}>{value} / {total}</Text>
      <View style={styles.collectionTrack}>
        <View style={[styles.collectionFill, { width: `${progress}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function ModuleButton({
  label,
  accentColor,
  onPress,
}: {
  label: string;
  accentColor: string;
  onPress: () => void;
}) {
  const variant = accentColor === FINANCE ? "finance" : accentColor === ASSETS ? "assets" : accentColor === SOLAR ? "solar" : accentColor === COLORS.warning ? "warning" : "call";
  return <AppButton label={label} variant={variant} onPress={onPress} fullWidth />;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  content: { width: "100%", maxWidth: 960, alignSelf: "center", padding: SPACING.lg, paddingBottom: 110, gap: SPACING.lg },
  loader: { flex: 1, alignItems: "center", justifyContent: "center", gap: SPACING.md },
  loaderText: { color: COLORS.textMuted, fontWeight: "700" },
  hero: {
    overflow: "hidden",
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    backgroundColor: "#0B1A2C",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    ...SHADOW,
  },
  heroGlowOne: { position: "absolute", width: 190, height: 190, borderRadius: RADIUS.round, right: -70, top: -85, backgroundColor: "rgba(220,38,38,0.18)" },
  heroGlowTwo: { position: "absolute", width: 150, height: 150, borderRadius: RADIUS.round, left: -70, bottom: -90, backgroundColor: "rgba(37,99,235,0.13)" },
  eyebrow: { color: COLORS.primary, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  title: { marginTop: SPACING.sm, color: COLORS.white, fontSize: 30, fontWeight: "900" },
  description: { marginTop: SPACING.sm, maxWidth: 620, color: COLORS.textSoft, fontSize: 13, lineHeight: 20 },
  heroMetrics: { marginTop: SPACING.xl, flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  heroMetric: { flexGrow: 1, flexBasis: 120, minHeight: 68, padding: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)" },
  heroMetricValue: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  heroMetricLabel: { marginTop: 4, color: COLORS.textMuted, fontSize: 10, fontWeight: "700" },
  error: { padding: SPACING.md, borderRadius: RADIUS.md, color: COLORS.danger, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.danger, fontWeight: "700" },
  sectionHeader: { marginTop: SPACING.sm },
  sectionTitle: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  sectionSubtitle: { marginTop: 3, color: COLORS.textMuted, fontSize: 11 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.md },
  segmentList: { gap: SPACING.md },
  segmentCard: { padding: SPACING.lg, borderRadius: RADIUS.xl, borderWidth: 1, backgroundColor: COLORS.surface },
  segmentHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACING.md },
  segmentName: { fontSize: 18, fontWeight: "900" },
  segmentCaption: { marginTop: 3, color: COLORS.textMuted, fontSize: 10 },
  segmentBadge: { minWidth: 54, minHeight: 34, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.round, paddingHorizontal: SPACING.sm },
  segmentBadgeText: { fontSize: 12, fontWeight: "900" },
  segmentMetrics: { marginTop: SPACING.lg, flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  miniMetric: { flexGrow: 1, flexBasis: 92, minHeight: 62, justifyContent: "center", padding: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceLight },
  miniMetricValue: { color: COLORS.white, fontSize: 15, fontWeight: "900" },
  miniMetricLabel: { marginTop: 3, color: COLORS.textMuted, fontSize: 9, fontWeight: "700" },
  segmentProgressRow: { marginTop: SPACING.lg, flexDirection: "row", justifyContent: "space-between", gap: SPACING.md },
  segmentProgressLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700" },
  segmentProgressValue: { fontSize: 11, fontWeight: "900" },
  segmentTrack: { height: 7, marginTop: SPACING.sm, overflow: "hidden", borderRadius: RADIUS.round, backgroundColor: COLORS.surfaceLight },
  segmentFill: { height: "100%", borderRadius: RADIUS.round },
  collectionCard: { padding: SPACING.lg, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, gap: SPACING.xl },
  collectionTitle: { color: COLORS.white, fontSize: 17, fontWeight: "900" },
  collectionRow: { gap: SPACING.sm },
  collectionHeader: { flexDirection: "row", justifyContent: "space-between", gap: SPACING.md },
  collectionLabel: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  collectionPercent: { fontSize: 12, fontWeight: "900" },
  collectionValue: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700" },
  collectionTrack: { height: 9, overflow: "hidden", borderRadius: RADIUS.round, backgroundColor: COLORS.surfaceLight },
  collectionFill: { height: "100%", borderRadius: RADIUS.round },
  actions: { gap: SPACING.sm },
  actionButton: { minHeight: 56, paddingHorizontal: SPACING.lg, flexDirection: "row", alignItems: "center", gap: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  actionDot: { width: 9, height: 9, borderRadius: RADIUS.round },
  actionText: { flex: 1, color: COLORS.white, fontSize: 14, fontWeight: "800" },
  actionArrow: { fontSize: 28, fontWeight: "700" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
