import { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";

import AppHeader from "../../components/AppHeader";
import BrandLogo from "../../components/BrandLogo";
import BottomNavigation from "../../components/BottomNavigation";
import DashboardStatCard from "../../components/DashboardStatCard";
import HomeQuickActions from "../../components/HomeQuickActions";
import QuickActionCard from "../../components/QuickActionCard";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { useDashboardStats } from "../../hooks/useDashboardStats";

type DashboardStat = {
  title: string;
  value: string | number;
  icon: string;
  accentColor: string;
  description: string;
};

type BusinessSegment = {
  title: string;
  subtitle: string;
  icon: string;
  accentColor: string;
  route: Href;
};

const BUSINESS_SEGMENTS: readonly BusinessSegment[] = [
  {
    title: "JMK Financial Servicess",
    subtitle: "Loans, customer finance and payment records",
    icon: "₹",
    accentColor: COLORS.finance,
    route: "/finance",
  },
  {
    title: "JMK Assets",
    subtitle: "Properties, leads, bookings and registry",
    icon: "🏢",
    accentColor: COLORS.assets,
    route: "/bookings",
  },
  {
    title: "JMK Solar Solutions",
    subtitle: "Solar enquiries, quotations and installation",
    icon: "☀️",
    accentColor: COLORS.solar,
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

export default function DashboardScreen() {
  const router = useRouter();
  const { data, isLoading, error, refresh } = useDashboardStats();

  const dashboardStats = useMemo<readonly DashboardStat[]>(
    () => [
      {
        title: "Total Leads",
        value: data.totalLeads,
        icon: "🎯",
        accentColor: "#3B82F6",
        description: `${data.newLeadsThisMonth} new this month`,
      },
      {
        title: "Customers",
        value: data.customers,
        icon: "👥",
        accentColor: "#8B5CF6",
        description: "Saved customer records",
      },
      {
        title: "Follow-ups",
        value: data.dueToday,
        icon: "📅",
        accentColor: "#F59E0B",
        description: "Due today",
      },
      {
        title: "Bookings",
        value: data.activeBookings,
        icon: "📝",
        accentColor: "#10B981",
        description: "Active bookings",
      },
      {
        title: "Received",
        value: formatAmount(data.bookingReceived),
        icon: "₹",
        accentColor: "#22C55E",
        description: "Booking collection",
      },
      {
        title: "Net Balance",
        value: formatAmount(data.financeBalance),
        icon: "💼",
        accentColor: data.financeBalance < 0 ? COLORS.danger : COLORS.finance,
        description: "Finance income minus expense",
      },
      {
        title: "Solar Projects",
        value: data.solarProjects,
        icon: "☀️",
        accentColor: COLORS.solar,
        description: "Active solar enquiries",
      },
    ],
    [data]
  );

  function openRoute(route: Href) {
    router.push(route);
  }

  function handleLogout() {
    Alert.alert("Logout", "Kya aap JMK CRM se logout karna chahte hain?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => router.replace("/login"),
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <AppHeader
        userName="Suresh Vishwakarma"
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
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeLabel}>Welcome Back</Text>
            <Text style={styles.userName}>Suresh Vishwakarma</Text>
            <Text style={styles.welcomeDescription}>
              Aaj ke business updates aur important follow-ups yahan dekhein.
            </Text>
          </View>

          <View style={styles.welcomeLogo}>
            <BrandLogo background="dark" showGroupName showTagline compact width={96} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Enterprise Overview</Text>
          <Text style={styles.sectionSubtitle}>
            {isLoading ? "Refreshing..." : "Live CRM summary"}
          </Text>
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
            <DashboardStatCard key={item.title} {...item} />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionSubtitle}>Frequently used modules</Text>
        </View>

        <View style={styles.quickActions}>
          <QuickActionCard title="Add New Lead" subtitle="Create property, finance or solar lead" icon="➕" accentColor="#3B82F6" onPress={() => openRoute("/lead-form")} />
          <QuickActionCard title="Today Follow-ups" subtitle="View calls and meetings due today" icon="📅" accentColor="#F59E0B" onPress={() => openRoute("/followups")} />
          <QuickActionCard title="Create Booking" subtitle="Start a new property booking" icon="📝" accentColor="#10B981" onPress={() => openRoute("/booking-form")} />
          <QuickActionCard title="Customer Search" subtitle="Open complete customer records" icon="🔎" accentColor="#8B5CF6" onPress={() => openRoute("/search")} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>More Modules</Text>
          <Text style={styles.sectionSubtitle}>Enterprise tools</Text>
        </View>
        <HomeQuickActions />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Business Segments</Text>
          <Text style={styles.sectionSubtitle}>JMK Group divisions</Text>
        </View>

        <View style={styles.segmentList}>
          {BUSINESS_SEGMENTS.map((segment) => (
            <QuickActionCard key={segment.title} title={segment.title} subtitle={segment.subtitle} icon={segment.icon} accentColor={segment.accentColor} onPress={() => openRoute(segment.route)} />
          ))}
        </View>

        {data.dueToday > 0 ? (
          <View style={styles.alertCard}>
            <View style={styles.alertIcon}><Text style={styles.alertEmoji}>⚠️</Text></View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Today&apos;s Attention</Text>
              <Text style={styles.alertText}>
                {data.dueToday} pending follow-up{data.dueToday === 1 ? "" : "s"} aaj due hain.
              </Text>
            </View>
          </View>
        ) : null}

        <QuickActionCard title="Logout" subtitle="Securely exit from JMK CRM" icon="🚪" accentColor={COLORS.danger} onPress={handleLogout} />

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>JMK GROUP</Text>
          <Text style={styles.footerTagline}>Trust • Growth • Future</Text>
          <Text style={styles.footerDeveloper}>Developed By Suresh Vishwakarma, Founder, JMK Group</Text>
        </View>
      </ScrollView>

      <BottomNavigation activeKey="dashboard" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  welcomeCard: { minHeight: 148, flexDirection: "row", alignItems: "center", padding: SPACING.lg, borderRadius: RADIUS.xl, backgroundColor: "#10233E", borderWidth: 1, borderColor: "#254A74", overflow: "hidden" },
  welcomeContent: { flex: 1, minWidth: 0, paddingRight: SPACING.md },
  welcomeLogo: { width: 112, alignItems: "center", justifyContent: "center" },
  welcomeLabel: { color: "#93C5FD", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  userName: { marginTop: 5, color: COLORS.white, fontSize: 23, fontWeight: "900" },
  welcomeDescription: { marginTop: 8, color: "#CBD5E1", fontSize: 12, lineHeight: 19 },
  sectionHeader: { marginTop: SPACING.xl, marginBottom: SPACING.md, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  sectionTitle: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  sectionSubtitle: { color: COLORS.textMuted, fontSize: 10, fontWeight: "600" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: SPACING.md },
  quickActions: { gap: SPACING.md },
  segmentList: { gap: SPACING.md },
  alertCard: { marginTop: SPACING.xl, marginBottom: SPACING.md, flexDirection: "row", padding: SPACING.lg, borderRadius: RADIUS.lg, backgroundColor: "rgba(245,158,11,0.1)", borderWidth: 1, borderColor: "rgba(245,158,11,0.35)" },
  alertIcon: { width: 43, height: 43, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.md, backgroundColor: "rgba(245,158,11,0.16)" },
  alertEmoji: { fontSize: 20 },
  alertContent: { flex: 1, marginLeft: SPACING.md },
  alertTitle: { color: "#FBBF24", fontSize: 14, fontWeight: "900" },
  alertText: { marginTop: 5, color: "#CBD5E1", fontSize: 11, lineHeight: 18 },
  footer: { marginTop: SPACING.xxl, alignItems: "center" },
  footerBrand: { color: COLORS.white, fontSize: 14, fontWeight: "900", letterSpacing: 1 },
  footerTagline: { marginTop: 5, color: COLORS.primary, fontSize: 11, fontWeight: "700" },
  footerDeveloper: { marginTop: 8, color: COLORS.textMuted, fontSize: 9, textAlign: "center" },
});
