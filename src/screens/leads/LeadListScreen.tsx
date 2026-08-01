import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import AppHeader from "../../components/AppHeader";
import BottomNavigation, { BottomNavigationKey } from "../../components/BottomNavigation";
import LeadListItem from "../../components/LeadListItem";
import EmptyState from "../../components/common/EmptyState";
import SearchField from "../../components/common/SearchField";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { useLeads } from "../../hooks/useLeads";
import type { LeadSegment, LeadStage } from "../../types/lead";
import { LEAD_SEGMENT_LABELS } from "../../types/lead";
import { updateLeadStage } from "../../services/leadsService";

const SEGMENTS: Array<LeadSegment | "all"> = ["all", "finance", "assets", "solar"];
const STAGES: Array<LeadStage | "all"> = [
  "all",
  "New Lead",
  "Contacted",
  "Site Visit",
  "Negotiation",
  "Booking",
  "Registry",
  "Completed",
  "Lost",
];

export default function LeadListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<LeadSegment | "all">("all");
  const [stage, setStage] = useState<LeadStage | "all">("all");
  const { leads, loading, refreshing, error, reload } = useLeads({ search, segment, stage });

  const statistics = useMemo(() => ({
    total: leads.length,
    hot: leads.filter((lead) => lead.temperature === "Hot").length,
    followups: leads.filter((lead) => Boolean(lead.nextFollowup)).length,
    value: leads.reduce((sum, lead) => sum + Number(lead.value || 0), 0),
  }), [leads]);

  function handleBottomNavigation(key: BottomNavigationKey) {
    if (key === "dashboard") router.replace("/dashboard");
  }

  function handleQuickStage(id: string, currentStage: LeadStage) {
    const activeStages = STAGES.filter((item): item is LeadStage => item !== "all");
    Alert.alert(
      "Update Lead Stage",
      `Current stage: ${currentStage}`,
      activeStages.map((nextStage) => ({
        text: nextStage,
        onPress: async () => {
          try {
            await updateLeadStage(id, nextStage);
            await reload();
          } catch (updateError) {
            Alert.alert("Update Failed", updateError instanceof Error ? updateError.message : "Stage update nahi ho saka.");
          }
        },
      })).concat([{ text: "Cancel", style: "cancel" }])
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        userName="JMK Team"
        segment="Enterprise Leads"
        notificationCount={0}
        onMenuPress={() => router.push("/settings")}
        onNotificationPress={() => router.push("/notifications")}
        onProfilePress={() => router.push("/settings")}
      />

      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LeadListItem
            lead={item}
            onPress={() => router.push({ pathname: "/lead-form", params: { id: item.id } })}
            onStagePress={() => handleQuickStage(item.id, item.stage)}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={COLORS.primary} />}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        ListHeaderComponent={
          <View>
            <View style={styles.headingRow}>
              <View style={styles.headingText}>
                <Text style={styles.title}>Lead Management</Text>
                <Text style={styles.subtitle}>Supabase live pipeline • Finance → Assets → Solar</Text>
              </View>
              <Pressable onPress={() => router.push("/lead-form")} style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Add Lead</Text>
              </Pressable>
            </View>

            <View style={styles.searchWrap}>
              <SearchField value={search} onChangeText={setSearch} placeholder="Name, mobile, property, location..." />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}><Text style={styles.statValue}>{statistics.total}</Text><Text style={styles.statTitle}>Leads</Text></View>
              <View style={styles.statCard}><Text style={styles.statValue}>{statistics.hot}</Text><Text style={styles.statTitle}>Hot</Text></View>
              <View style={styles.statCard}><Text style={styles.statValue}>{statistics.followups}</Text><Text style={styles.statTitle}>Follow-ups</Text></View>
              <View style={styles.statCard}><Text style={styles.statValue}>₹{Math.round(statistics.value / 1000)}K</Text><Text style={styles.statTitle}>Value</Text></View>
            </View>

            <Text style={styles.filterLabel}>Business Segment</Text>
            <View style={styles.filterWrap}>
              {SEGMENTS.map((item) => (
                <Pressable key={item} onPress={() => setSegment(item)} style={[styles.filterChip, segment === item && styles.activeChip]}>
                  <Text style={[styles.filterText, segment === item && styles.activeChipText]}>
                    {item === "all" ? "All" : LEAD_SEGMENT_LABELS[item]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterLabel}>Pipeline Stage</Text>
            <View style={styles.filterWrap}>
              {STAGES.map((item) => (
                <Pressable key={item} onPress={() => setStage(item)} style={[styles.filterChip, stage === item && styles.activeChip]}>
                  <Text style={[styles.filterText, stage === item && styles.activeChipText]}>{item === "all" ? "All" : item}</Text>
                </Pressable>
              ))}
            </View>

            {error ? (
              <Pressable style={styles.errorBox} onPress={reload}>
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.retryText}>Tap to retry</Text>
              </Pressable>
            ) : null}

            {loading ? <ActivityIndicator style={styles.loader} color={COLORS.primary} /> : null}
            <Text style={styles.resultText}>{leads.length} live leads</Text>
          </View>
        }
        ListEmptyComponent={!loading ? (
          <EmptyState icon="◎" title="No Leads Found" message="Filter clear karein ya nayi lead create karein." actionLabel="Add New Lead" onActionPress={() => router.push("/lead-form")} />
        ) : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <BottomNavigation activeKey="leads" onChange={handleBottomNavigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: { padding: SPACING.lg, paddingBottom: 120 },
  headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACING.md },
  headingText: { flex: 1 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: "900" },
  subtitle: { marginTop: 4, color: COLORS.textMuted, fontSize: 11 },
  addButton: { paddingHorizontal: 15, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.primary },
  addButtonText: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
  searchWrap: { marginTop: SPACING.xl },
  statsRow: { marginTop: SPACING.md, flexDirection: "row", gap: 7 },
  statCard: { flex: 1, minHeight: 66, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.md, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  statValue: { color: COLORS.text, fontSize: 17, fontWeight: "900" },
  statTitle: { marginTop: 3, color: COLORS.textMuted, fontSize: 9 },
  filterLabel: { marginTop: SPACING.lg, marginBottom: 8, color: COLORS.textMuted, fontSize: 11, fontWeight: "800" },
  filterWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700" },
  activeChipText: { color: COLORS.white },
  errorBox: { marginTop: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: "rgba(220,38,38,0.12)", borderWidth: 1, borderColor: COLORS.danger },
  errorText: { color: COLORS.danger, fontSize: 12, fontWeight: "700" },
  retryText: { marginTop: 4, color: COLORS.text, fontSize: 11 },
  loader: { marginTop: SPACING.lg },
  resultText: { marginVertical: SPACING.md, color: COLORS.textMuted, fontSize: 11 },
});
