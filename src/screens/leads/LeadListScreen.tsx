import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type AlertButton } from "react-native";
import { useRouter } from "expo-router";

import AppButton from "../../components/AppButton";
import AppHeader from "../../components/AppHeader";
import BottomNavigation from "../../components/BottomNavigation";
import EmptyState from "../../components/common/EmptyState";
import SearchField from "../../components/common/SearchField";
import LeadListItem from "../../components/LeadListItem";
import SegmentFilter, { type SegmentFilterValue } from "../../components/SegmentFilter";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import { useLeads } from "../../hooks/useLeads";
import { updateLeadStage } from "../../services/leadsService";
import type { LeadSegment, LeadStage } from "../../types/lead";

const STAGES: Array<LeadStage | "all"> = ["all", "New Lead", "Contacted", "Site Visit", "Negotiation", "Booking", "Registry", "Completed", "Lost"];
const STAGE_COLORS: Record<LeadStage | "all", string> = { all: "#475569", "New Lead": "#2563EB", Contacted: "#7C3AED", "Site Visit": "#F59E0B", Negotiation: "#D97706", Booking: COLORS.assets, Registry: COLORS.finance, Completed: "#16A34A", Lost: "#DC2626" };

export default function LeadListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<LeadSegment | "all">("all");
  const [stage, setStage] = useState<LeadStage | "all">("all");
  const { leads, loading, refreshing, error, reload } = useLeads({ search, segment, stage });

  const stats = useMemo(() => ({ total: leads.length, hot: leads.filter((lead) => lead.temperature === "Hot").length, followups: leads.filter((lead) => Boolean(lead.nextFollowup)).length, value: leads.reduce((sum, lead) => sum + Number(lead.value || 0), 0) }), [leads]);

  function updateStage(id: string, currentStage: LeadStage) {
    const buttons = STAGES
      .filter((item): item is LeadStage => item !== "all")
      .map<AlertButton>((nextStage) => ({
        text: nextStage,
        onPress: () => {
          void (async () => {
            await updateLeadStage(id, nextStage);
            await reload();
          })();
        },
      }));

    buttons.push({ text: "Cancel", style: "cancel" });
    Alert.alert("Update Lead Stage", `Current stage: ${currentStage}`, buttons);
  }

  return (
    <View style={styles.page}>
      <AppHeader userName="JMK Team" segment="Enterprise Leads" onMenuPress={() => router.push("/settings")} onNotificationPress={() => router.push("/notifications")} onProfilePress={() => router.push("/settings")} />
      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={COLORS.primary} />}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        renderItem={({ item }) => <LeadListItem lead={item} onPress={() => router.push({ pathname: "/lead-form", params: { id: item.id } })} onStagePress={() => updateStage(item.id, item.stage)} />}
        ListHeaderComponent={<View>
          <View style={styles.hero}>
            <View><Text style={styles.eyebrow}>SALES PIPELINE</Text><Text style={styles.title}>Lead Management</Text><Text style={styles.subtitle}>Finance, Assets aur Solar leads ka professional command center.</Text></View>
            <AppButton compact label="＋ Add Lead" onPress={() => router.push("/lead-form")} />
          </View>
          <SearchField value={search} onChangeText={setSearch} placeholder="Name, mobile, property, location..." />
          <View style={styles.stats}>
            {[["Leads", stats.total, "#2563EB"], ["Hot", stats.hot, "#DC2626"], ["Follow-ups", stats.followups, "#7C3AED"], ["Value", `₹${Math.round(stats.value / 1000)}K`, COLORS.finance]].map(([label, value, color]) => <View key={String(label)} style={styles.statCard}><View style={[styles.statBar, { backgroundColor: String(color) }]} /><Text style={[styles.statValue, { color: String(color) }]}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>)}
          </View>
          <Text style={styles.label}>BUSINESS SEGMENT</Text>
          <SegmentFilter value={segment as SegmentFilterValue} onChange={(value) => setSegment(value as LeadSegment | "all")} />
          <Text style={styles.label}>PIPELINE STAGE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stageRow}>{STAGES.map((item) => { const active = stage === item; const color = STAGE_COLORS[item]; return <Pressable key={item} onPress={() => setStage(item)} style={[styles.stageChip, { backgroundColor: active ? color : `${color}16`, borderColor: color }]}><Text style={[styles.stageText, { color: active ? COLORS.white : color }]}>{item === "all" ? "All" : item}</Text></Pressable>; })}</ScrollView>
          {error ? <Pressable style={styles.error} onPress={reload}><Text style={styles.errorText}>{error}</Text><Text style={styles.retry}>Tap to retry</Text></Pressable> : null}
          {loading ? <ActivityIndicator style={styles.loader} color={COLORS.primary} /> : null}
          <Text style={styles.result}>{leads.length} live leads</Text>
        </View>}
        ListEmptyComponent={!loading ? <EmptyState icon="◎" title="No Leads Found" message="Filter clear karein ya naya lead add karein." actionLabel="Add Lead" onActionPress={() => router.push("/lead-form")} /> : null}
      />
      <BottomNavigation activeKey="leads" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: 120 },
  hero: { marginBottom: SPACING.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACING.md },
  eyebrow: { color: COLORS.primary, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  title: { marginTop: 5, color: COLORS.text, fontSize: 25, fontWeight: "900" },
  subtitle: { marginTop: 5, maxWidth: 620, color: COLORS.textMuted, fontSize: 11 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginVertical: SPACING.lg },
  statCard: { position: "relative", minWidth: 130, flex: 1, overflow: "hidden", padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, ...SHADOW },
  statBar: { position: "absolute", left: 0, right: 0, bottom: 0, height: 3 },
  statValue: { fontSize: 20, fontWeight: "900" },
  statLabel: { marginTop: 4, color: COLORS.textMuted, fontSize: 9, fontWeight: "800" },
  label: { marginTop: SPACING.md, marginBottom: SPACING.xs, color: COLORS.textMuted, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  stageRow: { gap: SPACING.sm, paddingVertical: SPACING.xs, paddingBottom: SPACING.lg },
  stageChip: { minHeight: 39, justifyContent: "center", paddingHorizontal: SPACING.md, borderRadius: RADIUS.round, borderWidth: 1 },
  stageText: { fontSize: 10, fontWeight: "900" },
  error: { padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#FCA5A5" },
  errorText: { color: COLORS.danger, fontWeight: "800" },
  retry: { marginTop: 4, color: COLORS.textMuted, fontSize: 10 },
  loader: { marginVertical: SPACING.lg },
  result: { marginVertical: SPACING.md, color: COLORS.textMuted, fontSize: 10, fontWeight: "700" },
});
