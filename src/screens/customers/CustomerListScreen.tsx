import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import AppButton from "../../components/AppButton";
import AppHeader from "../../components/AppHeader";
import BottomNavigation from "../../components/BottomNavigation";
import EmptyState from "../../components/common/EmptyState";
import SearchField from "../../components/common/SearchField";
import SegmentFilter, { type SegmentFilterValue } from "../../components/SegmentFilter";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, RADIUS, SHADOW, SPACING, getSegmentColor } from "../../constants/theme";
import { deleteCustomer, getCustomers, subscribeToCustomers } from "../../storage/customerStorage";
import type { Customer, CustomerSegment } from "../../types/customer";

export default function CustomerListScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<CustomerSegment | "All">("All");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => { try { setError(""); setCustomers(await getCustomers({ limit: 500 })); } catch { setError("Customers load nahi ho sake."); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { void load(); return subscribeToCustomers(() => void load()); }, [load]));

  const filtered = useMemo(() => { const q = search.trim().toLowerCase(); return customers.filter((item) => (segment === "All" || item.segment === segment) && (!q || [item.name, item.mobile, item.city, item.segment, item.status].join(" ").toLowerCase().includes(q))); }, [customers, search, segment]);

  async function external(url: string) { if (await Linking.canOpenURL(url)) await Linking.openURL(url); else Alert.alert("Not Available", "Required app open nahi ho saka."); }
  function remove(item: Customer) { Alert.alert("Delete Customer", `${item.name} ko delete karna hai?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { await deleteCustomer(item.id); await load(); } }]); }

  return <SafeAreaView style={styles.page} edges={["top"]}>
    <AppHeader segment="Customer Management" />
    <View style={styles.body}>
      <View style={styles.hero}><View><Text style={styles.eyebrow}>CUSTOMER 360°</Text><Text style={styles.title}>Customers</Text><Text style={styles.subtitle}>{filtered.length} live customer records</Text></View><AppButton compact label="＋ Add Customer" onPress={() => router.push("/customer-form" as never)} /></View>
      <SearchField value={search} onChangeText={setSearch} placeholder="Search name, mobile, city or segment" />
      <Text style={styles.label}>BUSINESS SEGMENT</Text>
      <SegmentFilter value={(segment === "All" ? "all" : segment.toLowerCase()) as SegmentFilterValue} onChange={(value) => setSegment(value === "all" ? "All" : (value[0].toUpperCase() + value.slice(1)) as CustomerSegment)} />
      {error ? <Pressable style={styles.error} onPress={() => void load()}><Text style={styles.errorText}>{error}</Text><Text style={styles.retry}>Tap to retry</Text></Pressable> : null}
      <FlatList data={filtered} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} tintColor={COLORS.primary} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />} ListEmptyComponent={<EmptyState icon="◉" title={loading ? "Loading Customers" : "No Customers Found"} message={loading ? "Records load ho rahe hain." : "Search clear karein ya customer add karein."} />} renderItem={({ item }) => { const accent = getSegmentColor(item.segment); return <Pressable onPress={() => router.push({ pathname: "/customer-360", params: { id: item.id } } as never)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}><View style={[styles.accent, { backgroundColor: accent }]} /><View style={styles.cardHeader}><View style={[styles.avatar, { backgroundColor: `${accent}1F`, borderColor: `${accent}66` }]}><Text style={[styles.avatarText, { color: accent }]}>{item.name.charAt(0).toUpperCase()}</Text></View><View style={styles.main}><Text style={styles.name}>{item.name}</Text><Text style={styles.meta}>{item.mobile} • {item.city || "No city"}</Text></View><StatusBadge label={item.segment} tone={String(item.segment).toLowerCase() as "finance" | "assets" | "solar"} /></View><View style={styles.actions}><AppButton compact label="Call" variant="call" onPress={() => void external(`tel:${item.mobile}`)} /><AppButton compact label="WhatsApp" variant="whatsapp" onPress={() => void external(`https://wa.me/91${item.mobile}`)} /><AppButton compact label="Delete" variant="danger" onPress={() => remove(item)} /></View></Pressable>; }} />
    </View>
    <BottomNavigation activeKey="customers" />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background }, body: { flex: 1, paddingHorizontal: SPACING.lg },
  hero: { marginTop: SPACING.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACING.md }, eyebrow: { color: COLORS.primary, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 }, title: { marginTop: 4, color: COLORS.text, fontSize: 25, fontWeight: "900" }, subtitle: { marginTop: 3, color: COLORS.textMuted, fontSize: 11 },
  label: { marginTop: SPACING.md, color: COLORS.textMuted, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  error: { marginTop: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#FCA5A5" }, errorText: { color: COLORS.danger, fontWeight: "800" }, retry: { marginTop: 3, color: COLORS.textMuted, fontSize: 10 },
  list: { paddingTop: SPACING.lg, paddingBottom: 110 }, card: { position: "relative", overflow: "hidden", padding: SPACING.lg, marginBottom: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, ...SHADOW }, accent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 }, pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] }, cardHeader: { flexDirection: "row", alignItems: "center", gap: SPACING.md }, avatar: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 24, borderWidth: 1 }, avatarText: { fontSize: 18, fontWeight: "900" }, main: { flex: 1 }, name: { color: COLORS.text, fontSize: 16, fontWeight: "900" }, meta: { marginTop: 4, color: COLORS.textMuted, fontSize: 11 }, actions: { marginTop: SPACING.lg, flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
});
