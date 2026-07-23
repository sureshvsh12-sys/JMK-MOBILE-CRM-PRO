import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../../components/AppHeader";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import {
  deleteFollowUp,
  FollowUp,
  FollowUpStatus,
  getFollowUps,
  setFollowUpStatus,
} from "../../storage/followUpStorage";

const FILTERS: Array<"All" | FollowUpStatus> = ["All", "Pending", "Completed", "Cancelled"];

export default function FollowUpListScreen() {
  const [items, setItems] = useState<FollowUp[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => setItems(await getFollowUps()), []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .filter((item) => filter === "All" || item.status === filter)
      .filter((item) => !query || [item.customerName, item.mobile, item.subject, item.mode].join(" ").toLowerCase().includes(query))
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [filter, items, search]);

  const pendingCount = items.filter((item) => item.status === "Pending").length;
  const todayCount = items.filter((item) => item.status === "Pending" && new Date(item.dueAt).toDateString() === new Date().toDateString()).length;
  const overdueCount = items.filter((item) => item.status === "Pending" && new Date(item.dueAt).getTime() < Date.now()).length;

  const remove = (item: FollowUp) => {
    Alert.alert("Delete Follow-up", `${item.customerName} ka follow-up delete karna hai?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteFollowUp(item.id); await load(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader segment="Follow-ups" />
      <View style={styles.container}>
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.title}>Follow-ups</Text>
            <Text style={styles.subtitle}>Today ke calls aur meetings track karein</Text>
          </View>
          <Pressable style={styles.addButton} onPress={() => router.push("/followup-form" as never)}>
            <Text style={styles.addText}>＋ Add</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Pending" value={pendingCount} />
          <Stat label="Today" value={todayCount} />
          <Stat label="Overdue" value={overdueCount} danger />
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search customer, mobile or subject"
          placeholderTextColor={COLORS.textMuted}
          style={styles.search}
        />

        <View style={styles.filters}>
          {FILTERS.map((item) => (
            <Pressable key={item} style={[styles.filter, filter === item && styles.filterActive]} onPress={() => setFilter(item)}>
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} tintColor={COLORS.primary} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
          ListEmptyComponent={<Text style={styles.empty}>No follow-ups found.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{item.customerName.charAt(0).toUpperCase()}</Text></View>
                <View style={styles.cardMain}>
                  <Text style={styles.name}>{item.customerName}</Text>
                  <Text style={styles.subject}>{item.subject}</Text>
                  <Text style={styles.meta}>{formatDate(item.dueAt)} • {item.mode} • {item.priority}</Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              {item.notes ? <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text> : null}

              <View style={styles.actions}>
                <Action label="📞 Call" onPress={() => Linking.openURL(`tel:${item.mobile}`)} />
                <Action label="💬 WhatsApp" onPress={() => Linking.openURL(`https://wa.me/91${item.mobile}`)} />
                {item.status === "Pending" ? <Action label="✓ Done" onPress={async () => { await setFollowUpStatus(item.id, "Completed"); await load(); }} /> : null}
                <Pressable style={styles.moreButton} onPress={() => router.push({ pathname: "/followup-form", params: { id: item.id } } as never)}><Text style={styles.moreText}>Edit</Text></Pressable>
                <Pressable style={styles.moreButton} onPress={() => remove(item)}><Text style={styles.deleteText}>Delete</Text></Pressable>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function Stat({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return <View style={styles.stat}><Text style={[styles.statValue, danger && styles.danger]}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function StatusBadge({ status }: { status: FollowUpStatus }) {
  return <View style={[styles.badge, status === "Completed" && styles.badgeDone, status === "Cancelled" && styles.badgeCancel]}><Text style={styles.badgeText}>{status}</Text></View>;
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable style={styles.actionButton} onPress={onPress}><Text style={styles.actionText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: SPACING.lg },
  headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: COLORS.text, fontSize: 24, fontWeight: "900" },
  subtitle: { color: COLORS.textMuted, marginTop: 3, fontSize: 12 },
  addButton: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 11, borderRadius: RADIUS.md },
  addText: { color: COLORS.white, fontWeight: "900" },
  statsRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg },
  stat: { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12 },
  statValue: { color: COLORS.text, fontSize: 20, fontWeight: "900" },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 3 },
  danger: { color: COLORS.danger },
  search: { marginTop: SPACING.lg, minHeight: 48, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, color: COLORS.text, paddingHorizontal: 15 },
  filters: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md, flexWrap: "wrap" },
  filter: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.round, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.textMuted, fontWeight: "800", fontSize: 11 },
  filterTextActive: { color: COLORS.white },
  list: { paddingTop: SPACING.lg, paddingBottom: 28 },
  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  cardTop: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  cardMain: { flex: 1, marginLeft: SPACING.md },
  name: { color: COLORS.text, fontSize: 16, fontWeight: "900" },
  subject: { color: COLORS.text, marginTop: 3, fontSize: 13 },
  meta: { color: COLORS.textMuted, marginTop: 5, fontSize: 11 },
  badge: { backgroundColor: COLORS.warning, paddingHorizontal: 9, paddingVertical: 6, borderRadius: RADIUS.round },
  badgeDone: { backgroundColor: COLORS.success },
  badgeCancel: { backgroundColor: COLORS.surfaceLight },
  badgeText: { color: COLORS.white, fontWeight: "900", fontSize: 9 },
  notes: { color: COLORS.textMuted, marginTop: SPACING.md, lineHeight: 18, fontSize: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginTop: SPACING.lg },
  actionButton: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.sm, paddingHorizontal: 11, paddingVertical: 9 },
  actionText: { color: COLORS.text, fontWeight: "800", fontSize: 10 },
  moreButton: { justifyContent: "center", paddingHorizontal: 5 },
  moreText: { color: COLORS.info, fontSize: 10, fontWeight: "900" },
  deleteText: { color: COLORS.danger, fontSize: 10, fontWeight: "900" },
  empty: { color: COLORS.textMuted, textAlign: "center", marginTop: 60 },
});
