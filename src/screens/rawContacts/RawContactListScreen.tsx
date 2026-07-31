import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import AppHeader from "../../components/AppHeader";
import EmptyState from "../../components/common/EmptyState";
import SearchField from "../../components/common/SearchField";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import {
  convertRawContactToLead,
  fetchRawContacts,
  updateRawContact,
} from "../../services/rawContactsService";
import { subscribeToCrmRealtime } from "../../services/realtimeService";
import type {
  RawContact,
  RawContactCallStatus,
  RawContactSegment,
} from "../../types/rawContact";

const SEGMENTS: Array<{ key: "all" | RawContactSegment; label: string }> = [
  { key: "all", label: "All" },
  { key: "finance", label: "Finance" },
  { key: "assets", label: "Assets" },
  { key: "solar", label: "Solar" },
];

const STATUSES: RawContactCallStatus[] = [
  "Not Called",
  "No Answer",
  "Busy",
  "Callback",
  "Interested",
  "Not Interested",
  "Wrong Number",
];

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function formatDate(value: string | null) {
  if (!value) return "No callback";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RawContactListScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<RawContact[]>([]);
  const [segment, setSegment] = useState<"all" | RawContactSegment>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<RawContact | null>(null);
  const [status, setStatus] = useState<RawContactCallStatus>("Not Called");
  const [remarks, setRemarks] = useState("");
  const [callbackDate, setCallbackDate] = useState("");
  const [saving, setSaving] = useState(false);

  const loadContacts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await fetchRawContacts({ segment, limit: 500 });
      setContacts(data);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Raw Contacts load nahi ho sake.";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [segment]);

  useFocusEffect(useCallback(() => {
    void loadContacts();
  }, [loadContacts]));

  useEffect(() =>
    subscribeToCrmRealtime((change) => {
      if (change.table === "raw_contacts") {
        void loadContacts(true);
      }
    }),
  [loadContacts]);

  const filteredContacts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter((contact) =>
      [contact.full_name, contact.mobile, contact.city, contact.district, contact.call_status]
        .some((value) => String(value ?? "").toLowerCase().includes(term))
    );
  }, [contacts, search]);

  const statistics = useMemo(() => ({
    total: contacts.length,
    pending: contacts.filter((item) => item.call_status === "Not Called").length,
    callbacks: contacts.filter((item) => item.call_status === "Callback").length,
    interested: contacts.filter((item) => item.call_status === "Interested" && !item.converted_to_lead).length,
  }), [contacts]);

  function openContact(contact: RawContact) {
    setSelected(contact);
    setStatus(contact.call_status || "Not Called");
    setRemarks(contact.remarks || "");
    setCallbackDate(contact.callback_date ? contact.callback_date.slice(0, 16) : "");
  }

  async function callContact(contact: RawContact) {
    const phone = normalizePhone(contact.mobile);
    if (!phone) {
      Alert.alert("Invalid Mobile", "Is contact ka mobile number valid nahi hai.");
      return;
    }
    const supported = await Linking.canOpenURL(`tel:${phone}`);
    if (!supported) {
      Alert.alert("Calling unavailable", "Is device par phone dialer available nahi hai.");
      return;
    }
    await Linking.openURL(`tel:${phone}`);
  }

  async function saveCallOutcome() {
    if (!selected) return;
    if (status === "Callback" && !callbackDate.trim()) {
      Alert.alert("Callback Date Required", "Callback ke liye date/time YYYY-MM-DDTHH:mm format me enter karein.");
      return;
    }

    let callbackIso: string | null = null;
    if (callbackDate.trim()) {
      const parsed = new Date(callbackDate.trim());
      if (Number.isNaN(parsed.getTime())) {
        Alert.alert("Invalid Date", "Date/time YYYY-MM-DDTHH:mm format me enter karein.");
        return;
      }
      callbackIso = parsed.toISOString();
    }

    setSaving(true);
    try {
      const updated = await updateRawContact(selected.id, {
        call_status: status,
        remarks,
        callback_date: status === "Callback" ? callbackIso : null,
      });
      setContacts((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelected(updated);
      Alert.alert("Saved", "Call feedback successfully save ho gaya.");
    } catch (saveError) {
      Alert.alert("Save Failed", saveError instanceof Error ? saveError.message : "Call feedback save nahi hua.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConvertToLead() {
    if (!selected || selected.call_status !== "Interested" || selected.converted_to_lead) return;
    setSaving(true);
    try {
      const leadId = await convertRawContactToLead(selected.id);
      setSelected(null);
      await loadContacts(true);
      Alert.alert("Lead Created", "Raw Contact successfully Lead me convert ho gaya.", [
        { text: "Stay Here", style: "cancel" },
        { text: "Open Lead", onPress: () => router.push({ pathname: "/lead-form", params: { id: leadId } }) },
      ]);
    } catch (conversionError) {
      Alert.alert("Conversion Failed", conversionError instanceof Error ? conversionError.message : "Lead conversion failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader
        segment="Raw Contacts Calling Desk"
        notificationCount={statistics.callbacks}
        onMenuPress={() => router.push("/settings")}
        onNotificationPress={() => router.push("/notifications")}
        onProfilePress={() => router.push("/settings")}
      />

      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadContacts(true); }} tintColor={COLORS.primary} />}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Raw Contacts</Text>
            <Text style={styles.subtitle}>Call first. Interested contact ko hi Lead banayein.</Text>

            <View style={styles.statsRow}>
              {[
                ["Total", statistics.total],
                ["Not Called", statistics.pending],
                ["Callbacks", statistics.callbacks],
                ["Interested", statistics.interested],
              ].map(([label, value]) => (
                <View key={String(label)} style={styles.statCard}>
                  <Text style={styles.statValue}>{value}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.segmentRow}>
              {SEGMENTS.map((item) => (
                <Pressable key={item.key} onPress={() => setSegment(item.key)} style={[styles.filterChip, segment === item.key && styles.filterChipActive]}>
                  <Text style={[styles.filterText, segment === item.key && styles.filterTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            <SearchField value={search} onChangeText={setSearch} placeholder="Name, mobile, city or status..." />
            {!!error && <Pressable onPress={() => void loadContacts()} style={styles.errorBox}><Text style={styles.errorText}>{error}</Text><Text style={styles.retryText}>Tap to retry</Text></Pressable>}
            {loading && <Text style={styles.loadingText}>Loading Raw Contacts...</Text>}
          </View>
        }
        ListEmptyComponent={!loading ? <EmptyState title="No Raw Contacts" description="Selected segment/filter me koi contact nahi mila." /> : null}
        renderItem={({ item }) => (
          <Pressable onPress={() => openContact(item)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={styles.cardTop}>
              <View style={styles.cardCopy}>
                <Text style={styles.name}>{item.full_name || "Unnamed Contact"}</Text>
                <Text style={styles.mobile}>{item.mobile || "No mobile"}</Text>
                <Text style={styles.location}>{[item.city, item.district].filter(Boolean).join(", ") || "Location not provided"}</Text>
              </View>
              <View style={[styles.statusBadge, item.call_status === "Interested" && styles.interestedBadge]}>
                <Text style={styles.statusText}>{item.converted_to_lead ? "Converted" : item.call_status}</Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.segmentText}>{item.segment.toUpperCase()}</Text>
              <Text style={styles.callbackText}>{formatDate(item.callback_date)}</Text>
              <Pressable onPress={() => void callContact(item)} style={styles.callButton}><Text style={styles.callButtonText}>☎ Call</Text></Pressable>
            </View>
          </Pressable>
        )}
      />

      <Modal visible={Boolean(selected)} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selected?.full_name || "Raw Contact"}</Text>
                <Text style={styles.modalMobile}>{selected?.mobile}</Text>
              </View>
              <Pressable onPress={() => setSelected(null)}><Text style={styles.closeText}>✕</Text></Pressable>
            </View>

            <Text style={styles.label}>Call Status</Text>
            <View style={styles.statusOptions}>
              {STATUSES.map((item) => (
                <Pressable key={item} onPress={() => setStatus(item)} style={[styles.statusOption, status === item && styles.statusOptionActive]}>
                  <Text style={[styles.statusOptionText, status === item && styles.statusOptionTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>

            {status === "Callback" && (
              <>
                <Text style={styles.label}>Callback Date & Time</Text>
                <TextInput value={callbackDate} onChangeText={setCallbackDate} placeholder="2026-08-01T11:30" placeholderTextColor={COLORS.textMuted} style={styles.input} autoCapitalize="none" />
              </>
            )}

            <Text style={styles.label}>Remarks</Text>
            <TextInput value={remarks} onChangeText={setRemarks} placeholder="Call feedback..." placeholderTextColor={COLORS.textMuted} multiline style={[styles.input, styles.remarksInput]} />

            <View style={styles.modalActions}>
              <Pressable onPress={() => selected && void callContact(selected)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>☎ Call</Text></Pressable>
              <Pressable disabled={saving} onPress={() => void saveCallOutcome()} style={[styles.primaryButton, saving && styles.disabled]}><Text style={styles.primaryButtonText}>{saving ? "Saving..." : "Save Feedback"}</Text></Pressable>
            </View>

            {selected?.call_status === "Interested" && !selected.converted_to_lead && (
              <Pressable disabled={saving} onPress={() => void handleConvertToLead()} style={[styles.convertButton, saving && styles.disabled]}>
                <Text style={styles.convertButtonText}>Convert Interested Contact To Lead</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, padding: SPACING.lg, paddingBottom: 120 },
  title: { color: COLORS.white, fontSize: 26, fontWeight: "900" },
  subtitle: { marginTop: 5, marginBottom: SPACING.lg, color: COLORS.textMuted, fontSize: 13 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { minWidth: 72, flexGrow: 1, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  statValue: { color: COLORS.white, fontSize: 20, fontWeight: "900" },
  statLabel: { marginTop: 3, color: COLORS.textMuted, fontSize: 10, fontWeight: "700" },
  segmentRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.md },
  filterChip: { paddingHorizontal: SPACING.md, paddingVertical: 9, borderRadius: RADIUS.round, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "800" },
  filterTextActive: { color: COLORS.white },
  loadingText: { marginVertical: SPACING.lg, color: COLORS.textMuted, textAlign: "center" },
  errorBox: { marginTop: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: "rgba(220,38,38,0.12)", borderWidth: 1, borderColor: "rgba(248,113,113,0.35)" },
  errorText: { color: "#FCA5A5", fontSize: 12 },
  retryText: { marginTop: 4, color: COLORS.white, fontSize: 11, fontWeight: "800" },
  card: { padding: SPACING.lg, borderRadius: RADIUS.lg, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.md },
  cardCopy: { flex: 1 },
  name: { color: COLORS.white, fontSize: 16, fontWeight: "900" },
  mobile: { marginTop: 5, color: COLORS.textSoft, fontSize: 14, fontWeight: "700" },
  location: { marginTop: 4, color: COLORS.textMuted, fontSize: 12 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: RADIUS.round, backgroundColor: COLORS.surfaceLight },
  interestedBadge: { backgroundColor: "rgba(22,163,74,0.18)" },
  statusText: { color: COLORS.textSoft, fontSize: 10, fontWeight: "900" },
  cardFooter: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.borderSoft, flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  segmentText: { color: COLORS.primary, fontSize: 10, fontWeight: "900" },
  callbackText: { flex: 1, color: COLORS.textMuted, fontSize: 10 },
  callButton: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: RADIUS.md, backgroundColor: COLORS.success },
  callButtonText: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
  pressed: { opacity: 0.74, transform: [{ scale: 0.99 }] },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" },
  modalCard: { maxHeight: "92%", padding: SPACING.xl, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.lg },
  modalTitle: { color: COLORS.white, fontSize: 21, fontWeight: "900" },
  modalMobile: { marginTop: 4, color: COLORS.textMuted, fontSize: 13 },
  closeText: { color: COLORS.textMuted, fontSize: 24, padding: 8 },
  label: { marginTop: SPACING.md, marginBottom: 8, color: COLORS.textSoft, fontSize: 12, fontWeight: "800" },
  statusOptions: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  statusOption: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: RADIUS.round, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border },
  statusOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  statusOptionText: { color: COLORS.textMuted, fontSize: 10, fontWeight: "800" },
  statusOptionTextActive: { color: COLORS.white },
  input: { minHeight: 48, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, color: COLORS.white },
  remarksInput: { minHeight: 86, paddingTop: SPACING.md, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: SPACING.md, marginTop: SPACING.lg },
  secondaryButton: { minHeight: 48, paddingHorizontal: SPACING.lg, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border },
  secondaryButtonText: { color: COLORS.white, fontWeight: "900" },
  primaryButton: { minHeight: 48, flex: 1, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.md, backgroundColor: COLORS.primary },
  primaryButtonText: { color: COLORS.white, fontWeight: "900" },
  convertButton: { minHeight: 50, marginTop: SPACING.md, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.md, backgroundColor: COLORS.success },
  convertButtonText: { color: COLORS.white, fontWeight: "900", fontSize: 13 },
  disabled: { opacity: 0.55 },
});
