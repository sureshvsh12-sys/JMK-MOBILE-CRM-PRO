import {
    useCallback,
    useMemo,
    useState,
} from "react";

import {
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    useFocusEffect,
    useRouter,
} from "expo-router";

import AppHeader from "../../components/AppHeader";
import BottomNavigation, {
    BottomNavigationKey,
} from "../../components/BottomNavigation";
import LeadListItem from "../../components/LeadListItem";

import {
    COLORS,
    RADIUS,
    SPACING,
} from "../../constants/theme";

import {
    getLeads,
} from "../../storage/leadStorage";

import {
    Lead,
} from "../../types/lead";

export default function LeadListScreen() {
  const router = useRouter();

  const [leads, setLeads] = useState<
    Lead[]
  >([]);

  const [search, setSearch] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  const [activeFilter, setActiveFilter] =
    useState<
      "All" | "Hot" | "Warm" | "Cold"
    >("All");

  const loadLeads =
    useCallback(async () => {
      const storedLeads =
        await getLeads();

      setLeads(storedLeads);
    }, []);

  useFocusEffect(
    useCallback(() => {
      loadLeads();
    }, [loadLeads])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadLeads();
    setRefreshing(false);
  }

  function handleBottomNavigation(
    key: BottomNavigationKey
  ) {
    if (key === "dashboard") {
      router.replace("/dashboard");
      return;
    }

    if (key === "leads") {
      return;
    }
  }

  const filteredLeads = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return leads.filter((lead) => {
      if (
        activeFilter !== "All" &&
        lead.temperature !== activeFilter
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        lead.customer,
        lead.mobile,
        lead.email,
        lead.property,
        lead.location,
        lead.source,
        lead.assignedTo,
        lead.segment,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [
    activeFilter,
    leads,
    search,
  ]);

  const statistics = useMemo(() => {
    return {
      total: leads.length,
      hot: leads.filter(
        (lead) =>
          lead.temperature === "Hot"
      ).length,
      warm: leads.filter(
        (lead) =>
          lead.temperature === "Warm"
      ).length,
      cold: leads.filter(
        (lead) =>
          lead.temperature === "Cold"
      ).length,
    };
  }, [leads]);

  return (
    <View style={styles.container}>
      <AppHeader
        userName="Suresh Vishwakarma"
        segment="Enterprise Leads"
        notificationCount={4}
        onMenuPress={() => router.push("/settings")}
        onNotificationPress={() => router.push("/notifications")}
        onProfilePress={() => router.push("/settings")}
      />

      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LeadListItem
            lead={item}
            onPress={() =>
              router.push({
                pathname: "/lead-form",
                params: {
                  id: item.id,
                },
              })
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: SPACING.md,
            }}
          />
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.headingRow}>
              <View>
                <Text style={styles.title}>
                  Lead Management
                </Text>

                <Text
                  style={styles.subtitle}
                >
                  Property, Finance and Solar
                  leads
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  router.push("/lead-form")
                }
                style={styles.addButton}
              >
                <Text
                  style={styles.addButtonText}
                >
                  + Add Lead
                </Text>
              </Pressable>
            </View>

            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>
                🔎
              </Text>

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Name, mobile, property, location..."
                placeholderTextColor={
                  COLORS.textMuted
                }
                style={styles.searchInput}
              />
            </View>

            <View style={styles.statsRow}>
              {[
                {
                  key: "All",
                  title: "Total",
                  value: statistics.total,
                  color: COLORS.white,
                },
                {
                  key: "Hot",
                  title: "Hot",
                  value: statistics.hot,
                  color: COLORS.danger,
                },
                {
                  key: "Warm",
                  title: "Warm",
                  value: statistics.warm,
                  color: COLORS.warning,
                },
                {
                  key: "Cold",
                  title: "Cold",
                  value: statistics.cold,
                  color: COLORS.finance,
                },
              ].map((item) => {
                const active =
                  activeFilter === item.key;

                return (
                  <Pressable
                    key={item.key}
                    onPress={() =>
                      setActiveFilter(
                        item.key as
                          | "All"
                          | "Hot"
                          | "Warm"
                          | "Cold"
                      )
                    }
                    style={[
                      styles.statCard,
                      active &&
                        styles.activeStatCard,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statValue,
                        {
                          color: item.color,
                        },
                      ]}
                    >
                      {item.value}
                    </Text>

                    <Text
                      style={styles.statTitle}
                    >
                      {item.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.resultText}>
              Showing {filteredLeads.length} of{" "}
              {leads.length} leads
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              🎯
            </Text>

            <Text style={styles.emptyTitle}>
              No Leads Found
            </Text>

            <Text style={styles.emptyText}>
              Search filter clear karein ya
              nayi lead add karein.
            </Text>
          </View>
        }
        contentContainerStyle={
          styles.listContent
        }
        showsVerticalScrollIndicator={false}
      />

      <BottomNavigation
        activeKey="leads"
        onChange={handleBottomNavigation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
  },

  title: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "900",
  },

  subtitle: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 11,
  },

  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },

  addButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },

  searchBox: {
    marginTop: SPACING.xl,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  searchIcon: {
    marginRight: SPACING.sm,
    fontSize: 17,
  },

  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
  },

  statsRow: {
    marginTop: SPACING.md,
    flexDirection: "row",
    gap: 8,
  },

  statCard: {
    flex: 1,
    minHeight: 66,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  activeStatCard: {
    borderColor: COLORS.primary,
    backgroundColor:
      "rgba(220,38,38,0.12)",
  },

  statValue: {
    fontSize: 18,
    fontWeight: "900",
  },

  statTitle: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },

  resultText: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },

  emptyState: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    fontSize: 48,
  },

  emptyTitle: {
    marginTop: SPACING.md,
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
  },

  emptyText: {
    marginTop: 7,
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
});