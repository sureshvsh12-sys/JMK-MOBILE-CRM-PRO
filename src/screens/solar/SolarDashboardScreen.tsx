import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../../components/AppHeader";
import BottomNavigation from "../../components/BottomNavigation";
import type { BottomNavigationKey } from "../../components/BottomNavigation";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import {
  deleteSolarProject,
  getSolarProjects,
} from "../../storage/solarStorage";
import type { SolarProject, SolarStatus } from "../../storage/solarStorage";

const SOLAR_FORM_ROUTE: Href = "/solar-form";

const FILTERS: Array<"All" | SolarStatus> = [
  "All",
  "New Lead",
  "Site Visit",
  "Quotation",
  "Approved",
  "Installation",
  "Completed",
];

function formatAmount(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function SolarDashboardScreen() {
  const [projects, setProjects] = useState<SolarProject[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [refreshing, setRefreshing] = useState(false);

  const loadProjects = useCallback(async () => {
    setProjects(await getSolarProjects());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProjects();
    }, [loadProjects])
  );

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesFilter = filter === "All" || project.status === filter;
      const matchesSearch =
        !query ||
        [
          project.customerName,
          project.mobile,
          project.address,
          project.status,
          project.notes,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [filter, projects, search]);

  const summary = useMemo(
    () =>
      projects.reduce(
        (result, project) => ({
          capacity: result.capacity + project.systemSizeKw,
          value: result.value + project.projectValue,
          balance: result.balance + project.balanceAmount,
          completed: result.completed + (project.status === "Completed" ? 1 : 0),
        }),
        { capacity: 0, value: 0, balance: 0, completed: 0 }
      ),
    [projects]
  );

  const navigate = (key: BottomNavigationKey) => {
    const routes: Partial<Record<BottomNavigationKey, Href>> = {
      dashboard: "/dashboard",
      leads: "/leads",
      customers: "/customers",
      followups: "/followups",
    };
    const route = routes[key];
    if (route) router.replace(route);
  };

  const confirmDelete = (project: SolarProject) => {
    Alert.alert(
      "Delete Solar Project",
      `${project.customerName} ka solar record delete karna hai?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteSolarProject(project.id);
            await loadProjects();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader segment="JMK Solar Solutions" />

      <View style={styles.container}>
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.title}>Solar CRM</Text>
            <Text style={styles.subtitle}>Leads se installation tak</Text>
          </View>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push(SOLAR_FORM_ROUTE)}
          >
            <Text style={styles.addButtonText}>＋ Add</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Projects</Text>
            <Text style={styles.statValue}>{projects.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Capacity</Text>
            <Text style={styles.statValue}>{summary.capacity} kW</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Project Value</Text>
            <Text style={styles.statValue}>{formatAmount(summary.value)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Balance</Text>
            <Text style={[styles.statValue, styles.warningText]}>
              {formatAmount(summary.balance)}
            </Text>
          </View>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search customer, mobile, address or status"
          placeholderTextColor={COLORS.textMuted}
          style={styles.searchInput}
        />

        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const active = item === filter;
            return (
              <Pressable
                onPress={() => setFilter(item)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />

        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={COLORS.solar}
              onRefresh={async () => {
                setRefreshing(true);
                await loadProjects();
                setRefreshing(false);
              }}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No solar records found.</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({ pathname: "/solar-form", params: { id: item.id } })
              }
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.customerName}>{item.customerName}</Text>
                  <Text style={styles.mobile}>{item.mobile}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.address}>{item.address || "Address not added"}</Text>

              <View style={styles.detailsRow}>
                <View>
                  <Text style={styles.detailLabel}>System</Text>
                  <Text style={styles.detailValue}>{item.systemSizeKw} kW</Text>
                </View>
                <View>
                  <Text style={styles.detailLabel}>Value</Text>
                  <Text style={styles.detailValue}>{formatAmount(item.projectValue)}</Text>
                </View>
                <View>
                  <Text style={styles.detailLabel}>Advance</Text>
                  <Text style={[styles.detailValue, styles.successText]}>
                    {formatAmount(item.advanceAmount)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.detailLabel}>Balance</Text>
                  <Text style={[styles.detailValue, styles.warningText]}>
                    {formatAmount(item.balanceAmount)}
                  </Text>
                </View>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.followUpText}>
                  📅 {item.nextFollowUp || "No follow-up date"}
                </Text>
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    confirmDelete(item);
                  }}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </Pressable>
          )}
        />
      </View>

      <BottomNavigation activeKey="more" onChange={navigate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: SPACING.lg },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: COLORS.text, fontSize: 24, fontWeight: "900" },
  subtitle: { color: COLORS.textMuted, marginTop: 4 },
  addButton: {
    backgroundColor: COLORS.solar,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  addButtonText: { color: COLORS.black, fontWeight: "900" },
  statsRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  statLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: "700" },
  statValue: { color: COLORS.text, marginTop: 6, fontSize: 13, fontWeight: "900" },
  searchInput: {
    marginTop: SPACING.lg,
    minHeight: 50,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    paddingHorizontal: SPACING.lg,
  },
  filterList: { gap: SPACING.sm, paddingVertical: SPACING.md },
  filterChip: {
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  filterChipActive: { backgroundColor: COLORS.solar, borderColor: COLORS.solar },
  filterText: { color: COLORS.textMuted, fontSize: 11, fontWeight: "800" },
  filterTextActive: { color: COLORS.black },
  listContent: { paddingBottom: SPACING.xxl },
  emptyText: { color: COLORS.textMuted, textAlign: "center", marginTop: SPACING.xxl },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  cardTitleWrap: { flex: 1 },
  customerName: { color: COLORS.text, fontSize: 17, fontWeight: "900" },
  mobile: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  statusBadge: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.round,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusText: { color: COLORS.solar, fontSize: 10, fontWeight: "900" },
  address: { color: COLORS.textMuted, marginTop: SPACING.md, fontSize: 12 },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: "700" },
  detailValue: { color: COLORS.text, marginTop: 4, fontSize: 12, fontWeight: "900" },
  successText: { color: COLORS.success },
  warningText: { color: COLORS.warning },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.lg,
  },
  followUpText: { color: COLORS.textMuted, fontSize: 11 },
  deleteText: { color: COLORS.danger, fontWeight: "800", fontSize: 12 },
});
