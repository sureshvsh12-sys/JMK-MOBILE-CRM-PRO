import { useMemo } from "react";
import { Alert, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import AppButton from "../../components/AppButton";
import AppHeader from "../../components/AppHeader";
import BackButton from "../../components/BackButton";
import BottomNavigation from "../../components/BottomNavigation";
import EmptyState from "../../components/common/EmptyState";
import SearchField from "../../components/common/SearchField";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import { useFollowups } from "../../hooks/useFollowups";
import type { FollowUp, FollowUpStatus } from "../../services/followupsService";

const FILTERS: Array<"All" | FollowUpStatus> = ["All", "Pending", "Completed", "Cancelled"];
const FILTER_COLORS: Record<"All" | FollowUpStatus, string> = { All: "#475569", Pending: "#2563EB", Completed: "#16A34A", Cancelled: "#DC2626" };

function dayKey(value: string | Date) { const date = value instanceof Date ? value : new Date(value); return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }
function formatDue(value: string) { const date = new Date(value); return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }

export default function FollowUpListScreen() {
  const { items, filtered, search, setSearch, filter, setFilter, isRefreshing, refresh, updateStatus, remove, error } = useFollowups();
  const today = dayKey(new Date());
  const stats = useMemo(() => ({ pending: items.filter((x) => x.status === "Pending").length, today: items.filter((x) => x.status === "Pending" && dayKey(x.dueAt) === today).length, overdue: items.filter((x) => x.status === "Pending" && new Date(x.dueAt).getTime() < Date.now() && dayKey(x.dueAt) !== today).length }), [items, today]);

  async function openMode(item: FollowUp) { const mobile = item.mobile.replace(/\D/g, ""); if (item.mode === "WhatsApp") await Linking.openURL(`https://wa.me/${mobile.length === 10 ? `91${mobile}` : mobile}`); else if (item.mode === "Call") await Linking.openURL(`tel:${mobile}`); }
  function confirmDelete(item: FollowUp) { Alert.alert("Delete Follow-up", `${item.customerName} ka follow-up delete karna hai?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => void remove(item.id) }]); }

  return <View style={styles.page}>
    <AppHeader segment="Follow-ups" />
    <FlatList data={filtered} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={COLORS.primary} />} ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />} ListHeaderComponent={<View>
      <View style={styles.topRow}><BackButton /><AppButton compact label="＋ New Follow-up" onPress={() => router.push("/followup-form")} /></View>
      <Text style={styles.eyebrow}>SALES ACTIVITY</Text><Text style={styles.title}>Follow-ups</Text><Text style={styles.subtitle}>Calls, WhatsApp, meetings aur site visits ko ek jagah track karein.</Text>
      <View style={styles.stats}>{[["Pending", stats.pending, "#2563EB"], ["Due Today", stats.today, "#F59E0B"], ["Overdue", stats.overdue, "#DC2626"]].map(([label, value, color]) => <View key={String(label)} style={styles.statCard}><Text style={[styles.statValue, { color: String(color) }]}>{value}</Text><Text style={styles.statLabel}>{label}</Text><View style={[styles.statBar, { backgroundColor: String(color) }]} /></View>)}</View>
      <SearchField value={search} onChangeText={setSearch} placeholder="Search name, mobile, subject or mode" />
      <View style={styles.filters}>{FILTERS.map((item) => { const active = filter === item; const color = FILTER_COLORS[item]; return <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, { backgroundColor: active ? color : `${color}16`, borderColor: color }]}><Text style={[styles.filterText, { color: active ? COLORS.white : color }]}>{item}</Text></Pressable>; })}</View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>} ListEmptyComponent={<EmptyState icon="◷" title="No Follow-ups" message="Selected filter me koi follow-up nahi mila." actionLabel="Add Follow-up" onActionPress={() => router.push("/followup-form")} />} renderItem={({ item }) => { const overdue = item.status === "Pending" && new Date(item.dueAt).getTime() < Date.now(); return <Pressable onPress={() => router.push({ pathname: "/followup-form", params: { id: item.id } })} style={({ pressed }) => [styles.card, pressed && styles.pressed]}><View style={styles.cardTop}><View style={styles.avatar}><Text style={styles.avatarText}>{(item.customerName || "F").charAt(0).toUpperCase()}</Text></View><View style={styles.main}><Text style={styles.name}>{item.customerName}</Text><Text style={styles.subject}>{item.subject || item.mode}</Text></View><StatusBadge label={item.status} tone={item.status === "Completed" ? "green" : item.status === "Cancelled" ? "red" : overdue ? "red" : "blue"} /></View><View style={styles.dueBox}><Text style={styles.dueIcon}>◷</Text><View><Text style={[styles.due, overdue && styles.overdue]}>{formatDue(item.dueAt)}</Text><Text style={styles.meta}>{item.mode} • {item.priority} priority</Text></View></View>{item.notes ? <Text numberOfLines={2} style={styles.notes}>{item.notes}</Text> : null}<View style={styles.actions}>{item.status === "Pending" ? <AppButton compact label={item.mode === "WhatsApp" ? "WhatsApp" : "Call"} variant={item.mode === "WhatsApp" ? "whatsapp" : "call"} onPress={() => void openMode(item)} /> : null}{item.status !== "Completed" ? <AppButton compact label="Complete" variant="success" onPress={() => void updateStatus(item.id, "Completed")} /> : null}<AppButton compact label="Delete" variant="danger" onPress={() => confirmDelete(item)} /></View></Pressable>; }} />
    <BottomNavigation activeKey="followups" />
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background }, content: { padding: SPACING.lg, paddingBottom: 120 }, topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg }, eyebrow: { color: COLORS.primary, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 }, title: { marginTop: 5, color: COLORS.text, fontSize: 26, fontWeight: "900" }, subtitle: { marginTop: 5, color: COLORS.textMuted, fontSize: 11 },
  stats: { flexDirection: "row", gap: SPACING.sm, marginVertical: SPACING.lg }, statCard: { position: "relative", flex: 1, overflow: "hidden", padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, ...SHADOW }, statValue: { fontSize: 20, fontWeight: "900" }, statLabel: { marginTop: 5, color: COLORS.textMuted, fontSize: 9, fontWeight: "800" }, statBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3 }, filters: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginVertical: SPACING.md }, filter: { minHeight: 38, justifyContent: "center", paddingHorizontal: SPACING.md, borderRadius: RADIUS.round, borderWidth: 1 }, filterText: { fontSize: 10, fontWeight: "900" }, error: { color: COLORS.danger, fontWeight: "800" },
  card: { padding: SPACING.lg, borderRadius: RADIUS.lg, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, ...SHADOW }, pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] }, cardTop: { flexDirection: "row", alignItems: "center", gap: SPACING.md }, avatar: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 23, backgroundColor: COLORS.primarySoft, borderWidth: 1, borderColor: "#FCA5A5" }, avatarText: { color: COLORS.primary, fontSize: 18, fontWeight: "900" }, main: { flex: 1 }, name: { color: COLORS.text, fontSize: 16, fontWeight: "900" }, subject: { marginTop: 3, color: COLORS.textMuted, fontSize: 11 }, dueBox: { marginTop: SPACING.md, flexDirection: "row", alignItems: "center", gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceLight }, dueIcon: { color: COLORS.info, fontSize: 18 }, due: { color: COLORS.text, fontSize: 12, fontWeight: "900" }, overdue: { color: COLORS.danger }, meta: { marginTop: 3, color: COLORS.textMuted, fontSize: 9 }, notes: { marginTop: SPACING.md, color: COLORS.textSoft, fontSize: 11, lineHeight: 17 }, actions: { marginTop: SPACING.lg, flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
});
