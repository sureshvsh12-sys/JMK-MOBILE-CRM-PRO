import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AppHeader from "../../components/AppHeader";
import BottomNavigation from "../../components/BottomNavigation";
import BrandLogo from "../../components/BrandLogo";
import DashboardStatCard from "../../components/DashboardStatCard";
import HomeQuickActions from "../../components/HomeQuickActions";
import QuickActionCard from "../../components/QuickActionCard";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useDashboardStats } from "../../hooks/useDashboardStats";

type DashboardStat = {
  title: string;
  value: string | number;
  icon: string;
  accentColor: string;
  description: string;
  trend?: string;
  route?: Href;
};

type BusinessSegment = {
  title: string;
  subtitle: string;
  icon: string;
  accentColor: string;
  route: Href;
};

type ChartItem = {
  label: string;
  value: number;
  color: string;
};

const FINANCE_COLOR = "#10B981";
const ASSETS_COLOR = "#D4A72C";
const SOLAR_COLOR = "#F97316";

const BUSINESS_SEGMENTS: readonly BusinessSegment[] = [
  {
    title: "JMK Financial Servicess",
    subtitle: "Loans, customer finance and payment records",
    icon: "₹",
    accentColor: FINANCE_COLOR,
    route: "/finance",
  },
  {
    title: "JMK Assets",
    subtitle: "Properties, leads, bookings and registry",
    icon: "⌂",
    accentColor: ASSETS_COLOR,
    route: "/bookings",
  },
  {
    title: "JMK Solar Solutions",
    subtitle: "Solar enquiries, quotations and installation",
    icon: "☀",
    accentColor: SOLAR_COLOR,
    route: "/solar",
  },
];

function formatAmount(value: number): string {
  const absoluteValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absoluteValue >= 10_000_000) {
    return `${sign}₹${(absoluteValue / 10_000_000).toFixed(1)}Cr`;
  }

  if (absoluteValue >= 100_000) {
    return `${sign}₹${(absoluteValue / 100_000).toFixed(1)}L`;
  }

  if (absoluteValue >= 1_000) {
    return `${sign}₹${(absoluteValue / 1_000).toFixed(1)}K`;
  }

  return `${sign}₹${Math.round(absoluteValue)}`;
}

function greetingForNow(): string {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardScreen() {
  const router = useRouter();
  const { data, isLoading, error, refresh } = useDashboardStats();
  const { user, signOut } = useAuth();
  const displayName =
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  "Suresh Vishwakarma";

  const dashboardStats = useMemo<readonly DashboardStat[]>(
    () => [
      {
        title: "Raw Contacts",
        value: data.rawContacts,
        icon: "◉",
        accentColor: "#38BDF8",
        description: `${data.interestedRawContacts} interested contacts`,
        trend: "Live",
        route: "/raw-contacts",
      },
      {
        title: "Total Leads",
        value: data.totalLeads,
        icon: "◎",
        accentColor: "#60A5FA",
        description: `${data.newLeadsThisMonth} new this month`,
        trend: `+${data.newLeadsThisMonth}`,
        route: "/leads",
      },
      {
        title: "Customers",
        value: data.customers,
        icon: "♟",
        accentColor: "#A78BFA",
        description: "Saved customer records",
        route: "/customers",
      },
      {
        title: "Follow-ups",
        value: data.dueToday,
        icon: "✓",
        accentColor: "#F59E0B",
        description: `${data.overdueFollowups} overdue`,
        trend: "Today",
        route: "/followups",
      },
      {
        title: "Bookings",
        value: data.activeBookings,
        icon: "▣",
        accentColor: ASSETS_COLOR,
        description: "Active property bookings",
        route: "/bookings",
      },
      {
        title: "Solar Projects",
        value: data.solarProjects,
        icon: "☀",
        accentColor: SOLAR_COLOR,
        description: "Active solar enquiries",
        route: "/solar",
      },
    ],
    [data]
  );

  const chartData = useMemo<readonly ChartItem[]>(
    () => [
      { label: "Raw", value: data.rawContacts, color: "#38BDF8" },
      { label: "Leads", value: data.totalLeads, color: "#60A5FA" },
      { label: "Clients", value: data.customers, color: "#A78BFA" },
      { label: "Bookings", value: data.activeBookings, color: ASSETS_COLOR },
      { label: "Solar", value: data.solarProjects, color: SOLAR_COLOR },
    ],
    [data]
  );

  const maxChartValue = Math.max(1, ...chartData.map((item) => item.value));
  const conversionRate =
    data.rawContacts > 0
      ? Math.min(100, Math.round((data.totalLeads / data.rawContacts) * 100))
      : 0;

  function openRoute(route: Href) {
    router.push(route);
  }

  function handleLogout() {
    Alert.alert("Logout", "Kya aap JMK CRM se logout karna chahte hain?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/login");
          } catch (reason) {
            Alert.alert(
              "Logout Failed",
              reason instanceof Error ? reason.message : "Please try again."
            );
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <AppHeader
        userName={displayName}
        segment="CRM PRO Enterprise"
        notificationCount={data.unreadNotifications}
        onMenuPress={() => openRoute("/settings")}
        onNotificationPress={() => openRoute("/notifications")}
        onProfilePress={() => openRoute("/settings")}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroTopRow}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>
                {data.source === "cloud" ? "LIVE CLOUD" : "LOCAL MODE"}
              </Text>
            </View>

            <BrandLogo
              background="dark"
              showGroupName
              showTagline
              compact
              width={92}
            />
          </View>

          <Text style={styles.greeting}>{greetingForNow()},</Text>
          <Text style={styles.userName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.heroDescription}>
            Your complete JMK Group business command center.
          </Text>

          <View style={styles.heroMetrics}>
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricValue}>{data.dueToday}</Text>
              <Text style={styles.heroMetricLabel}>Due today</Text>
            </View>
            <View style={styles.heroMetricDivider} />
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricValue}>{conversionRate}%</Text>
              <Text style={styles.heroMetricLabel}>Conversion</Text>
            </View>
            <View style={styles.heroMetricDivider} />
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricValue}>{data.unreadNotifications}</Text>
              <Text style={styles.heroMetricLabel}>New alerts</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>BUSINESS PULSE</Text>
            <Text style={styles.sectionTitle}>Enterprise Overview</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => void refresh()}
            style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}
          >
            <Text style={styles.refreshIcon}>↻</Text>
            <Text style={styles.refreshText}>{isLoading ? "Syncing" : "Refresh"}</Text>
          </Pressable>
        </View>

        {error ? (
          <QuickActionCard
            title="Dashboard Refresh"
            subtitle={error}
            icon="↻"
            accentColor={COLORS.danger}
            onPress={() => void refresh()}
          />
        ) : null}

        <View style={styles.statsGrid}>
          {dashboardStats.map((item) => (
            <DashboardStatCard
              key={item.title}
              {...item}
              onPress={item.route ? () => openRoute(item.route as Href) : undefined}
            />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>REVENUE</Text>
            <Text style={styles.sectionTitle}>Financial Snapshot</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Live summary</Text>
        </View>

        <View style={styles.revenueRow}>
          <Pressable
            onPress={() => openRoute("/bookings")}
            style={({ pressed }) => [styles.revenueCard, pressed && styles.pressed]}
          >
            <View style={[styles.revenueIcon, { backgroundColor: `${ASSETS_COLOR}20` }]}> 
              <Text style={[styles.revenueIconText, { color: ASSETS_COLOR }]}>₹</Text>
            </View>
            <Text style={styles.revenueLabel}>Booking Received</Text>
            <Text style={styles.revenueValue}>{formatAmount(data.bookingReceived)}</Text>
            <Text style={[styles.revenueHint, { color: ASSETS_COLOR }]}>JMK Assets</Text>
          </Pressable>

          <Pressable
            onPress={() => openRoute("/finance")}
            style={({ pressed }) => [styles.revenueCard, pressed && styles.pressed]}
          >
            <View style={[styles.revenueIcon, { backgroundColor: `${FINANCE_COLOR}20` }]}> 
              <Text style={[styles.revenueIconText, { color: FINANCE_COLOR }]}>₹</Text>
            </View>
            <Text style={styles.revenueLabel}>Net Balance</Text>
            <Text style={styles.revenueValue}>{formatAmount(data.financeBalance)}</Text>
            <Text
              style={[
                styles.revenueHint,
                { color: data.financeBalance < 0 ? COLORS.danger : FINANCE_COLOR },
              ]}
            >
              {data.financeBalance < 0 ? "Needs attention" : "Healthy balance"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>ANALYTICS</Text>
            <Text style={styles.sectionTitle}>Pipeline Distribution</Text>
          </View>
          <Pressable onPress={() => openRoute("/reports")}>
            <Text style={styles.linkText}>View reports ›</Text>
          </Pressable>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>CRM Portfolio</Text>
              <Text style={styles.chartSubtitle}>Current record volume</Text>
            </View>
            <View style={styles.conversionPill}>
              <Text style={styles.conversionValue}>{conversionRate}%</Text>
              <Text style={styles.conversionLabel}>conversion</Text>
            </View>
          </View>

          <View style={styles.chartBars}>
            {chartData.map((item) => {
              const height = Math.max(10, Math.round((item.value / maxChartValue) * 108));

              return (
                <View key={item.label} style={styles.chartColumn}>
                  <Text style={styles.chartValue}>{item.value}</Text>
                  <View style={styles.chartTrack}>
                    <View
                      style={[
                        styles.chartBar,
                        { height, backgroundColor: item.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartLabel}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>PRIORITY</Text>
            <Text style={styles.sectionTitle}>Today&apos;s Follow-ups</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Action required</Text>
        </View>

        <Pressable
          onPress={() => openRoute("/followups")}
          style={({ pressed }) => [styles.followupCard, pressed && styles.pressed]}
        >
          <View style={styles.followupMain}>
            <View style={styles.followupIconBox}>
              <Text style={styles.followupIcon}>✓</Text>
            </View>
            <View style={styles.followupCopy}>
              <Text style={styles.followupTitle}>
                {data.dueToday > 0
                  ? `${data.dueToday} follow-up${data.dueToday === 1 ? "" : "s"} due today`
                  : "No follow-ups due today"}
              </Text>
              <Text style={styles.followupSubtitle}>
                {data.overdueFollowups > 0
                  ? `${data.overdueFollowups} overdue item${data.overdueFollowups === 1 ? "" : "s"} also need attention`
                  : "Your daily schedule is up to date"}
              </Text>
            </View>
            <Text style={styles.followupArrow}>›</Text>
          </View>

          <View style={styles.followupProgressTrack}>
            <View
              style={[
                styles.followupProgress,
                {
                  width: `${Math.min(
                    100,
                    data.dueToday + data.overdueFollowups > 0
                      ? (data.dueToday /
                          (data.dueToday + data.overdueFollowups)) *
                          100
                      : 100
                  )}%`,
                },
              ]}
            />
          </View>
        </Pressable>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>SHORTCUTS</Text>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <Text style={styles.sectionSubtitle}>One tap access</Text>
        </View>

        <View style={styles.primaryActionsGrid}>
          <Pressable
            onPress={() => openRoute("/lead-form")}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
          >
            <View style={[styles.primaryActionIcon, { backgroundColor: "#2563EB" }]}> 
              <Text style={styles.primaryActionIconText}>＋</Text>
            </View>
            <Text style={styles.primaryActionTitle}>New Lead</Text>
            <Text style={styles.primaryActionSubtitle}>Create enquiry</Text>
          </Pressable>

          <Pressable
            onPress={() => openRoute("/raw-contacts")}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
          >
            <View style={[styles.primaryActionIcon, { backgroundColor: "#0891B2" }]}> 
              <Text style={styles.primaryActionIconText}>☎</Text>
            </View>
            <Text style={styles.primaryActionTitle}>Call Queue</Text>
            <Text style={styles.primaryActionSubtitle}>Raw contacts</Text>
          </Pressable>

          <Pressable
            onPress={() => openRoute("/booking-form")}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
          >
            <View style={[styles.primaryActionIcon, { backgroundColor: ASSETS_COLOR }]}> 
              <Text style={styles.primaryActionIconText}>▣</Text>
            </View>
            <Text style={styles.primaryActionTitle}>Booking</Text>
            <Text style={styles.primaryActionSubtitle}>New property</Text>
          </Pressable>

          <Pressable
            onPress={() => openRoute("/search")}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
          >
            <View style={[styles.primaryActionIcon, { backgroundColor: "#7C3AED" }]}> 
              <Text style={styles.primaryActionIconText}>⌕</Text>
            </View>
            <Text style={styles.primaryActionTitle}>Search</Text>
            <Text style={styles.primaryActionSubtitle}>All records</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>WORKSPACE</Text>
            <Text style={styles.sectionTitle}>Enterprise Tools</Text>
          </View>
        </View>
        <HomeQuickActions />

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>JMK GROUP</Text>
            <Text style={styles.sectionTitle}>Business Segments</Text>
          </View>
          <Text style={styles.sectionSubtitle}>3 divisions</Text>
        </View>

        <View style={styles.segmentList}>
          {BUSINESS_SEGMENTS.map((segment) => (
            <QuickActionCard
              key={segment.title}
              title={segment.title}
              subtitle={segment.subtitle}
              icon={segment.icon}
              accentColor={segment.accentColor}
              onPress={() => openRoute(segment.route)}
            />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>RECENT ACTIVITY</Text>
            <Text style={styles.sectionTitle}>Live CRM Snapshot</Text>
          </View>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: "#38BDF8" }]} />
            <View style={styles.activityCopy}>
              <Text style={styles.activityTitle}>Raw contact pipeline</Text>
              <Text style={styles.activityText}>
                {data.interestedRawContacts} interested from {data.rawContacts} total contacts
              </Text>
            </View>
          </View>
          <View style={styles.activityDivider} />
          <View style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: "#60A5FA" }]} />
            <View style={styles.activityCopy}>
              <Text style={styles.activityTitle}>Lead growth</Text>
              <Text style={styles.activityText}>
                {data.newLeadsThisMonth} new leads added this month
              </Text>
            </View>
          </View>
          <View style={styles.activityDivider} />
          <View style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: FINANCE_COLOR }]} />
            <View style={styles.activityCopy}>
              <Text style={styles.activityTitle}>Business collection</Text>
              <Text style={styles.activityText}>
                {formatAmount(data.bookingReceived)} received across active bookings
              </Text>
            </View>
          </View>
        </View>

        <QuickActionCard
          title="Logout"
          subtitle="Securely exit from JMK CRM"
          icon="⇥"
          accentColor={COLORS.danger}
          onPress={handleLogout}
        />

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>JMK GROUP</Text>
          <Text style={styles.footerTagline}>Trust • Growth • Future</Text>
          <Text style={styles.footerDeveloper}>
            Developed By Suresh Vishwakarma, Founder, JMK Group
          </Text>
        </View>
      </ScrollView>

      <BottomNavigation activeKey="dashboard" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3F8",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  heroCard: {
    minHeight: 250,
    padding: SPACING.xl,
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: "#0B2441",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.34)",
    ...SHADOW,
  },
  heroGlowOne: {
    position: "absolute",
    top: -70,
    right: -45,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(37,99,235,0.22)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -90,
    left: -45,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(220,38,38,0.12)",
  },
  heroTopRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(15,23,42,0.48)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.2)",
  },
  liveDot: {
    width: 7,
    height: 7,
    marginRight: 7,
    borderRadius: RADIUS.round,
    backgroundColor: "#22C55E",
  },
  liveText: {
    color: "#CFE2F6",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  greeting: {
    marginTop: 13,
    color: "#9FC5EE",
    fontSize: 13,
    fontWeight: "700",
  },
  userName: {
    marginTop: 3,
    maxWidth: "82%",
    color: COLORS.white,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  heroDescription: {
    marginTop: 7,
    color: "#C7D6E7",
    fontSize: 12,
    lineHeight: 19,
  },
  heroMetrics: {
    marginTop: 22,
    minHeight: 59,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(4,14,29,0.38)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
  },
  heroMetricItem: {
    flex: 1,
    alignItems: "center",
  },
  heroMetricDivider: {
    width: 1,
    height: 27,
    backgroundColor: "rgba(148,163,184,0.2)",
  },
  heroMetricValue: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
  },
  heroMetricLabel: {
    marginTop: 2,
    color: "#8FA7C0",
    fontSize: 9,
    fontWeight: "700",
  },
  sectionHeader: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionEyebrow: {
    marginBottom: 4,
    color: "#71869B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  sectionTitle: {
    color: "#102033",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.25,
  },
  sectionSubtitle: {
    color: "#61758A",
    fontSize: 10,
    fontWeight: "700",
  },
  linkText: {
    color: "#60A5FA",
    fontSize: 10,
    fontWeight: "800",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 34,
    paddingHorizontal: 11,
    borderRadius: RADIUS.round,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE6F1",
  },
  refreshIcon: {
    marginRight: 5,
    color: "#60A5FA",
    fontSize: 15,
    fontWeight: "900",
  },
  refreshText: {
    color: "#30465D",
    fontSize: 10,
    fontWeight: "800",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: SPACING.md,
  },
  revenueRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  revenueCard: {
    flex: 1,
    minHeight: 164,
    padding: SPACING.lg,
    overflow: "hidden",
    borderRadius: RADIUS.xl,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE6F1",
  },
  revenueIcon: {
    width: 39,
    height: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
  },
  revenueIconText: {
    fontSize: 19,
    fontWeight: "900",
  },
  revenueLabel: {
    marginTop: 15,
    color: "#61758A",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  revenueValue: {
    marginTop: 6,
    color: "#102033",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  revenueHint: {
    marginTop: 7,
    fontSize: 10,
    fontWeight: "800",
  },
  chartCard: {
    minHeight: 238,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE6F1",
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  chartTitle: {
    color: "#102033",
    fontSize: 15,
    fontWeight: "900",
  },
  chartSubtitle: {
    marginTop: 3,
    color: "#61758A",
    fontSize: 10,
    fontWeight: "600",
  },
  conversionPill: {
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(16,185,129,0.12)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.26)",
  },
  conversionValue: {
    color: FINANCE_COLOR,
    fontSize: 15,
    fontWeight: "900",
  },
  conversionLabel: {
    marginTop: 1,
    color: "#7FA596",
    fontSize: 8,
    fontWeight: "700",
  },
  chartBars: {
    height: 155,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: SPACING.lg,
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
  },
  chartValue: {
    marginBottom: 6,
    color: "#30465D",
    fontSize: 9,
    fontWeight: "800",
  },
  chartTrack: {
    width: 22,
    height: 108,
    justifyContent: "flex-end",
    overflow: "hidden",
    borderRadius: RADIUS.round,
    backgroundColor: "#E8EFF6",
  },
  chartBar: {
    width: "100%",
    borderRadius: RADIUS.round,
  },
  chartLabel: {
    marginTop: 7,
    color: "#61758A",
    fontSize: 8,
    fontWeight: "700",
  },
  followupCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    backgroundColor: "#FFF9EC",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.28)",
  },
  followupMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  followupIconBox: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(245,158,11,0.16)",
  },
  followupIcon: {
    color: "#FBBF24",
    fontSize: 22,
    fontWeight: "900",
  },
  followupCopy: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  followupTitle: {
    color: "#102033",
    fontSize: 14,
    fontWeight: "900",
  },
  followupSubtitle: {
    marginTop: 5,
    color: "#61758A",
    fontSize: 10,
    lineHeight: 16,
  },
  followupArrow: {
    color: "#FBBF24",
    fontSize: 27,
    fontWeight: "700",
  },
  followupProgressTrack: {
    height: 5,
    marginTop: SPACING.lg,
    overflow: "hidden",
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(245,158,11,0.14)",
  },
  followupProgress: {
    height: "100%",
    borderRadius: RADIUS.round,
    backgroundColor: "#F59E0B",
  },
  primaryActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: SPACING.md,
  },
  primaryAction: {
    width: "48.4%",
    minHeight: 126,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE6F1",
  },
  primaryActionIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
  },
  primaryActionIconText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
  },
  primaryActionTitle: {
    marginTop: SPACING.md,
    color: "#102033",
    fontSize: 13,
    fontWeight: "900",
  },
  primaryActionSubtitle: {
    marginTop: 4,
    color: "#61758A",
    fontSize: 10,
    fontWeight: "600",
  },
  segmentList: {
    gap: SPACING.md,
  },
  activityCard: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE6F1",
  },
  activityItem: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
  },
  activityDot: {
    width: 9,
    height: 9,
    marginRight: SPACING.md,
    borderRadius: RADIUS.round,
  },
  activityCopy: {
    flex: 1,
  },
  activityTitle: {
    color: "#102033",
    fontSize: 12,
    fontWeight: "800",
  },
  activityText: {
    marginTop: 4,
    color: "#61758A",
    fontSize: 10,
    lineHeight: 15,
  },
  activityDivider: {
    height: 1,
    backgroundColor: "#E5EDF5",
  },
  footer: {
    marginTop: SPACING.xxl,
    alignItems: "center",
  },
  footerBrand: {
    color: "#102033",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  footerTagline: {
    marginTop: 5,
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  footerDeveloper: {
    marginTop: 8,
    color: "#61758A",
    fontSize: 9,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
