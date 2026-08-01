import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import AppButton from "../../components/AppButton";
import AppHeader from "../../components/AppHeader";
import BottomNavigation from "../../components/BottomNavigation";
import EmptyState from "../../components/common/EmptyState";
import SearchField from "../../components/common/SearchField";
import SegmentFilter, {
  type SegmentFilterValue,
} from "../../components/SegmentFilter";
import StatusBadge, { type StatusTone } from "../../components/StatusBadge";
import {
  COLORS,
  RADIUS,
  SHADOW,
  SPACING,
  getSegmentColor,
} from "../../constants/theme";
import {
  deleteCustomer,
  getCustomers,
  subscribeToCustomers,
} from "../../storage/customerStorage";
import type { Customer, CustomerSegment } from "../../types/customer";

function customerInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "C";
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

function segmentTone(segment: CustomerSegment): StatusTone {
  const normalized = String(segment).toLowerCase();
  if (normalized.includes("finance")) return "finance";
  if (normalized.includes("solar")) return "solar";
  return "assets";
}

export default function CustomerListScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<CustomerSegment | "All">("All");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setCustomers(await getCustomers({ limit: 500 }));
    } catch (loadError) {
      console.error("Unable to load customers:", loadError);
      setError("Customers load nahi ho sake.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      return subscribeToCustomers(() => void load());
    }, [load])
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((item) => {
      const matchesSegment = segment === "All" || item.segment === segment;
      const matchesQuery =
        !query ||
        [item.name, item.mobile, item.city, item.segment, item.status]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesSegment && matchesQuery;
    });
  }, [customers, search, segment]);

  const segmentCounts = useMemo(
    () => ({
      total: customers.length,
      finance: customers.filter((item) =>
        String(item.segment).toLowerCase().includes("finance")
      ).length,
      assets: customers.filter((item) =>
        String(item.segment).toLowerCase().includes("asset")
      ).length,
      solar: customers.filter((item) =>
        String(item.segment).toLowerCase().includes("solar")
      ).length,
    }),
    [customers]
  );

  async function openExternal(url: string) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Not Available", "Required app open nahi ho saka.");
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Action Failed", "Required app open nahi ho saka.");
    }
  }

  function removeCustomer(item: Customer) {
    Alert.alert("Delete Customer", `${item.name} ko permanently delete karna hai?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCustomer(item.id);
            await load();
          } catch {
            Alert.alert("Delete Failed", "Customer delete nahi ho saka.");
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.page} edges={["top"]}>
      <AppHeader segment="Customer Management" />

      <View style={styles.body}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={COLORS.primary}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
            />
          }
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View>
              <View style={styles.hero}>
                <View style={styles.heroGlowOne} />
                <View style={styles.heroGlowTwo} />
                <View style={styles.heroHeader}>
                  <View style={styles.heroCopy}>
                    <Text style={styles.eyebrow}>CUSTOMER 360°</Text>
                    <Text style={styles.title}>Customers</Text>
                    <Text style={styles.subtitle}>
                      Complete customer records, communication and business history.
                    </Text>
                  </View>
                  <AppButton
                    compact
                    label="＋ Add Customer"
                    onPress={() => router.push("/customer-form" as never)}
                  />
                </View>

                <View style={styles.metricRow}>
                  <CustomerMetric label="Total" value={segmentCounts.total} color="#2563EB" />
                  <CustomerMetric label="Finance" value={segmentCounts.finance} color={COLORS.finance} />
                  <CustomerMetric label="Assets" value={segmentCounts.assets} color={COLORS.assets} />
                  <CustomerMetric label="Solar" value={segmentCounts.solar} color={COLORS.solar} />
                </View>
              </View>

              <View style={styles.controlsCard}>
                <SearchField
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search name, mobile, city or segment"
                />
                <Text style={styles.label}>BUSINESS SEGMENT</Text>
                <SegmentFilter
                  value={
                    (segment === "All"
                      ? "all"
                      : segment.toLowerCase()) as SegmentFilterValue
                  }
                  onChange={(value) =>
                    setSegment(
                      value === "all"
                        ? "All"
                        : ((value.charAt(0).toUpperCase() + value.slice(1)) as CustomerSegment)
                    )
                  }
                />
              </View>

              <View style={styles.listHeadingRow}>
                <View>
                  <Text style={styles.listHeading}>Customer Directory</Text>
                  <Text style={styles.listCount}>{filtered.length} visible records</Text>
                </View>
                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>

              {error ? (
                <Pressable style={styles.error} onPress={() => void load()}>
                  <Text style={styles.errorText}>{error}</Text>
                  <Text style={styles.retry}>Tap to retry</Text>
                </Pressable>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="◉"
              title={loading ? "Loading Customers" : "No Customers Found"}
              message={
                loading
                  ? "Records load ho rahe hain."
                  : "Search clear karein ya pehla customer add karein."
              }
            />
          }
          renderItem={({ item }) => {
            const accent = getSegmentColor(item.segment);
            const phone = normalizePhone(item.mobile);

            return (
              <Pressable
                onPress={() =>
                  router.push({ pathname: "/customer-360", params: { id: item.id } } as never)
                }
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <View style={[styles.accent, { backgroundColor: accent }]} />

                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: accent, shadowColor: accent },
                    ]}
                  >
                    <Text style={styles.avatarText}>{customerInitials(item.name)}</Text>
                  </View>

                  <View style={styles.main}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name || "Unnamed Customer"}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {item.mobile || "No mobile"} • {item.city || "City not added"}
                    </Text>
                    <View style={styles.badgeRow}>
                      <StatusBadge label={item.segment} tone={segmentTone(item.segment)} />
                      {item.status ? (
                        <StatusBadge label={item.status} tone="blue" solid={false} />
                      ) : null}
                    </View>
                  </View>

                  <View style={[styles.openButton, { backgroundColor: `${accent}18` }]}>
                    <Text style={[styles.openButtonText, { color: accent }]}>›</Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <AppButton
                    compact
                    label="Call"
                    variant="call"
                    onPress={() => void openExternal(`tel:${phone}`)}
                  />
                  <AppButton
                    compact
                    label="WhatsApp"
                    variant="whatsapp"
                    onPress={() => void openExternal(`https://wa.me/91${phone}`)}
                  />
                  <AppButton
                    compact
                    label="Open 360°"
                    variant="secondary"
                    onPress={() =>
                      router.push({ pathname: "/customer-360", params: { id: item.id } } as never)
                    }
                  />
                  <AppButton
                    compact
                    label="Delete"
                    variant="danger"
                    onPress={() => removeCustomer(item)}
                  />
                </View>
              </Pressable>
            );
          }}
        />
      </View>

      <BottomNavigation activeKey="customers" />
    </SafeAreaView>
  );
}

function CustomerMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricDot, { backgroundColor: color }]} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  body: { flex: 1 },
  list: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: 118,
  },
  hero: {
    overflow: "hidden",
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    backgroundColor: "#0B2441",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.28)",
    ...SHADOW,
  },
  heroGlowOne: {
    position: "absolute",
    top: -90,
    right: -50,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(37,99,235,0.24)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -100,
    left: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(220,38,38,0.12)",
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  heroCopy: { flex: 1 },
  eyebrow: {
    color: "#93C5FD",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  title: {
    marginTop: 5,
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "900",
  },
  subtitle: {
    maxWidth: 560,
    marginTop: 7,
    color: "#C8D8E8",
    fontSize: 11,
    lineHeight: 17,
  },
  metricRow: {
    marginTop: SPACING.xl,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  metricCard: {
    minWidth: 76,
    flexGrow: 1,
    minHeight: 70,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(4,14,29,0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  metricDot: { width: 8, height: 8, borderRadius: 4 },
  metricValue: {
    marginTop: 8,
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
  },
  metricLabel: {
    marginTop: 2,
    color: "#9CB1C5",
    fontSize: 9,
    fontWeight: "700",
  },
  controlsCard: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  label: {
    marginTop: SPACING.md,
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  listHeadingRow: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listHeading: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  listCount: { marginTop: 3, color: COLORS.textMuted, fontSize: 10.5 },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(5,150,105,0.10)",
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  liveText: { color: COLORS.success, fontSize: 9, fontWeight: "900" },
  error: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: { color: COLORS.danger, fontWeight: "800" },
  retry: { marginTop: 3, color: COLORS.textMuted, fontSize: 10 },
  card: {
    position: "relative",
    overflow: "hidden",
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  accent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 5 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  avatar: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 27,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  main: { flex: 1, minWidth: 0 },
  name: { color: COLORS.text, fontSize: 16, fontWeight: "900" },
  meta: { marginTop: 4, color: COLORS.textMuted, fontSize: 11 },
  badgeRow: { marginTop: SPACING.sm, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  openButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  openButtonText: { marginTop: -2, fontSize: 27, fontWeight: "800" },
  actions: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft,
  },
});
