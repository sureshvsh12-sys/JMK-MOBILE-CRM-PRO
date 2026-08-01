import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import AppHeader from "../../components/AppHeader";
import EmptyState from "../../components/common/EmptyState";
import SearchField from "../../components/common/SearchField";
import { COLORS, RADIUS, SHADOW, SOFT_SHADOW, SPACING } from "../../constants/theme";
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

type QueueFilter = "all" | "pending" | "callbacks" | "interested";

const SEGMENTS: Array<{
  key: "all" | RawContactSegment;
  label: string;
  color: string;
}> = [
  { key: "all", label: "All", color: COLORS.primary },
  { key: "finance", label: "Finance", color: "#10B981" },
  { key: "assets", label: "Assets", color: "#D4A72C" },
  { key: "solar", label: "Solar", color: "#F97316" },
];

const QUEUES: Array<{ key: QueueFilter; label: string; color: string; icon: string }> = [
  { key: "all", label: "All Contacts", color: "#475569", icon: "◎" },
  { key: "pending", label: "Call Now", color: "#2563EB", icon: "☎" },
  { key: "callbacks", label: "Callbacks", color: "#7C3AED", icon: "↻" },
  { key: "interested", label: "Interested", color: "#16A34A", icon: "✓" },
];

const STATUSES: Array<{
  key: RawContactCallStatus;
  icon: string;
  color: string;
}> = [
  { key: "Not Called", icon: "○", color: "#2563EB" },
  { key: "No Answer", icon: "↗", color: "#F59E0B" },
  { key: "Busy", icon: "⌛", color: "#F97316" },
  { key: "Callback", icon: "↻", color: "#7C3AED" },
  { key: "Interested", icon: "✓", color: "#16A34A" },
  { key: "Not Interested", icon: "−", color: "#DC2626" },
  { key: "Wrong Number", icon: "!", color: "#374151" },
];

const STATUS_COLORS: Record<RawContactCallStatus, string> = {
  "Not Called": "#94A3B8",
  "No Answer": "#F59E0B",
  Busy: "#F97316",
  Callback: "#3B82F6",
  Interested: "#10B981",
  "Not Interested": "#EF4444",
  "Wrong Number": "#A855F7",
};

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function parseCallbackDate(value: string): string | null {
  const normalized = value.trim();
  if (!normalized) return null;

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
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

function isCallbackDue(value: string | null) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return !Number.isNaN(time) && time <= Date.now();
}

function segmentColor(segment: RawContactSegment) {
  return SEGMENTS.find((item) => item.key === segment)?.color ?? COLORS.primary;
}

function contactDisplayName(contact: RawContact | null | undefined) {
  const name = contact?.full_name?.trim();
  return name || "Raw Contact";
}

export default function RawContactListScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<RawContact[]>([]);
  const [segment, setSegment] = useState<"all" | RawContactSegment>("all");
  const [queue, setQueue] = useState<QueueFilter>("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<RawContact | null>(null);
  const [status, setStatus] = useState<RawContactCallStatus>("Not Called");
  const [remarks, setRemarks] = useState("");
  const [callbackDate, setCallbackDate] = useState("");
  const [saving, setSaving] = useState(false);

  const loadContacts = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError("");

      try {
        const data = await fetchRawContacts({ segment, limit: 500 });
        setContacts(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Raw Contacts load nahi ho sake."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [segment]
  );

  useFocusEffect(
    useCallback(() => {
      void loadContacts();
    }, [loadContacts])
  );

  useEffect(
    () =>
      subscribeToCrmRealtime((change) => {
        if (change.table === "raw_contacts") {
          void loadContacts(true);
        }
      }),
    [loadContacts]
  );

  const statistics = useMemo(
    () => ({
      total: contacts.length,
      pending: contacts.filter((item) => item.call_status === "Not Called")
        .length,
      callbacks: contacts.filter((item) => item.call_status === "Callback")
        .length,
      dueCallbacks: contacts.filter(
        (item) => item.call_status === "Callback" && isCallbackDue(item.callback_date)
      ).length,
      interested: contacts.filter(
        (item) => item.call_status === "Interested" && !item.converted_to_lead
      ).length,
    }),
    [contacts]
  );

  const filteredContacts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return contacts
      .filter((contact) => {
        if (queue === "pending") return contact.call_status === "Not Called";
        if (queue === "callbacks") return contact.call_status === "Callback";
        if (queue === "interested") {
          return contact.call_status === "Interested" && !contact.converted_to_lead;
        }
        return true;
      })
      .filter((contact) => {
        if (!term) return true;
        return [
          contact.full_name,
          contact.mobile,
          contact.city,
          contact.district,
          contact.call_status,
          contact.remarks,
        ].some((value) => String(value ?? "").toLowerCase().includes(term));
      })
      .sort((first, second) => {
        if (queue === "callbacks") {
          const firstTime = first.callback_date
            ? new Date(first.callback_date).getTime()
            : Number.MAX_SAFE_INTEGER;
          const secondTime = second.callback_date
            ? new Date(second.callback_date).getTime()
            : Number.MAX_SAFE_INTEGER;
          return firstTime - secondTime;
        }

        return (
          new Date(second.updated_at).getTime() -
          new Date(first.updated_at).getTime()
        );
      });
  }, [contacts, queue, search]);

  function openContact(contact: RawContact) {
    setSelected(contact);
    setStatus(contact.call_status || "Not Called");
    setRemarks(contact.remarks || "");
    setCallbackDate(contact.callback_date ? contact.callback_date.slice(0, 16) : "");
  }

  function closeContact() {
    if (saving) return;
    setSelected(null);
  }

  async function callContact(contact: RawContact, openEditor = true) {
    const phone = normalizePhone(contact.mobile);
    if (!phone) {
      Alert.alert("Invalid Mobile", "Is contact ka mobile number valid nahi hai.");
      return;
    }

    if (openEditor) openContact(contact);

    try {
      const callUrl = `tel:${phone}`;
      const supported = await Linking.canOpenURL(callUrl);
      if (!supported) {
        Alert.alert(
          "Calling unavailable",
          "Is device par phone dialer available nahi hai."
        );
        return;
      }
      await Linking.openURL(callUrl);
    } catch {
      Alert.alert("Call Failed", "Phone dialer open nahi ho saka.");
    }
  }

  async function persistOutcome(convertAfterSave = false) {
    if (!selected) return;

    if (!remarks.trim() && status !== "Not Called") {
      Alert.alert("Remarks Required", "Call ka short feedback enter karein.");
      return;
    }

    let callbackIso: string | null = null;
    if (status === "Callback") {
      callbackIso = parseCallbackDate(callbackDate);
      if (!callbackIso) {
        Alert.alert(
          "Callback Date Required",
          "Valid date/time YYYY-MM-DDTHH:mm format me enter karein."
        );
        return;
      }
    }

    setSaving(true);
    try {
      const updated = await updateRawContact(selected.id, {
        call_status: status,
        remarks,
        callback_date: status === "Callback" ? callbackIso : null,
      });

      setContacts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setSelected(updated);

      if (convertAfterSave) {
        const leadId = await convertRawContactToLead(updated.id);
        setSelected(null);
        await loadContacts(true);
        Alert.alert(
          "Lead Created",
          "Interested Raw Contact successfully Lead me convert ho gaya.",
          [
            { text: "Stay Here", style: "cancel" },
            {
              text: "Open Lead",
              onPress: () =>
                router.push({ pathname: "/lead-form", params: { id: leadId } }),
            },
          ]
        );
        return;
      }

      Alert.alert("Feedback Saved", "Call result successfully update ho gaya.");
    } catch (saveError) {
      Alert.alert(
        convertAfterSave ? "Conversion Failed" : "Save Failed",
        saveError instanceof Error
          ? saveError.message
          : "Call feedback save nahi hua."
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedAccent = selected
    ? segmentColor(selected.segment)
    : COLORS.primary;

  return (
    <View style={styles.container}>
      <AppHeader
        segment="Raw Contacts Calling Desk"
        notificationCount={statistics.dueCallbacks}
        onMenuPress={() => router.push("/settings")}
        onNotificationPress={() => router.push("/notifications")}
        onProfilePress={() => router.push("/settings")}
      />

      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadContacts(true);
            }}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        ListHeaderComponent={
          <View>
            <View style={styles.heroCard}>
              <View style={styles.heroGlow} />
              <Text style={styles.eyebrow}>JMK CALLING DESK</Text>
              <Text style={styles.title}>Raw Contact Calling</Text>
              <Text style={styles.subtitle}>
                Call first • Save feedback • Interested contact ko Lead banayein
              </Text>

              <View style={styles.heroActions}>
                <Pressable
                  onPress={() => setQueue("pending")}
                  style={({ pressed }) => [
                    styles.heroButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.heroButtonIcon}>☎</Text>
                  <View>
                    <Text style={styles.heroButtonValue}>{statistics.pending}</Text>
                    <Text style={styles.heroButtonLabel}>Ready to call</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setQueue("callbacks")}
                  style={({ pressed }) => [
                    styles.heroButton,
                    styles.callbackHeroButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.heroButtonIcon}>↻</Text>
                  <View>
                    <Text style={styles.heroButtonValue}>
                      {statistics.dueCallbacks}
                    </Text>
                    <Text style={styles.heroButtonLabel}>Due callbacks</Text>
                  </View>
                </Pressable>
              </View>
            </View>

            <View style={styles.statsRow}>
              {[
                ["Total", statistics.total, "#64748B"],
                ["Not Called", statistics.pending, COLORS.primary],
                ["Callbacks", statistics.callbacks, "#3B82F6"],
                ["Interested", statistics.interested, "#10B981"],
              ].map(([label, value, color]) => (
                <View key={String(label)} style={styles.statCard}>
                  <View
                    style={[styles.statIndicator, { backgroundColor: String(color) }]}
                  />
                  <Text style={styles.statValue}>{value}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionLabel}>BUSINESS SEGMENT</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalFilters}
            >
              {SEGMENTS.map((item) => {
                const active = segment === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setSegment(item.key)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: item.color,
                        borderColor: item.color,
                      },
                      active && styles.filterChipActive,
                    ]}
                  >
                    <View
                      style={[styles.segmentDot, { backgroundColor: COLORS.white }]}
                    />
                    <Text style={styles.filterText}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.sectionLabel}>CALLING QUEUE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalFilters}
            >
              {QUEUES.map((item) => {
                const active = queue === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setQueue(item.key)}
                    style={[
                      styles.queueChip,
                      {
                        backgroundColor: item.color,
                        borderColor: item.color,
                      },
                      active && styles.queueChipActive,
                    ]}
                  >
                    <Text style={styles.queueIcon}>{item.icon}</Text>
                    <Text style={styles.queueText}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <SearchField
              value={search}
              onChangeText={setSearch}
              placeholder="Name, mobile, city, status or remarks..."
            />

            <View style={styles.listHeadingRow}>
              <View>
                <Text style={styles.listHeading}>
                  {QUEUES.find((item) => item.key === queue)?.label}
                </Text>
                <Text style={styles.listCount}>
                  {filteredContacts.length} contacts in queue
                </Text>
              </View>
            </View>

            {!!error && (
              <Pressable
                onPress={() => void loadContacts()}
                style={styles.errorBox}
              >
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.retryText}>Tap to retry</Text>
              </Pressable>
            )}
            {loading && (
              <Text style={styles.loadingText}>Loading Raw Contacts...</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="Queue Empty"
              description="Selected segment aur calling queue me koi contact nahi mila."
            />
          ) : null
        }
        renderItem={({ item }) => {
          const accent = segmentColor(item.segment);
          const statusColor = STATUS_COLORS[item.call_status];
          const due =
            item.call_status === "Callback" && isCallbackDue(item.callback_date);

          return (
            <Pressable
              onPress={() => openContact(item)}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.cardAccent, { backgroundColor: accent }]} />
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: `${accent}22` }]}>
                  <Text style={[styles.avatarText, { color: accent }]}>
                    {(item.full_name || "R").trim().charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.cardCopy}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.full_name || "Unnamed Contact"}
                  </Text>
                  <Text style={styles.mobile}>{item.mobile || "No mobile"}</Text>
                  <Text style={styles.location} numberOfLines={1}>
                    {[item.city, item.district].filter(Boolean).join(", ") ||
                      "Location not provided"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusColor },
                  ]}
                >
                  <View
                    style={[styles.statusDot, { backgroundColor: statusColor }]}
                  />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {item.converted_to_lead ? "Converted" : item.call_status}
                  </Text>
                </View>
              </View>

              {!!item.remarks && (
                <Text style={styles.remarksPreview} numberOfLines={2}>
                  “{item.remarks}”
                </Text>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.footerCopy}>
                  <Text style={[styles.segmentText, { color: accent }]}>
                    {item.segment.toUpperCase()}
                  </Text>
                  <Text style={[styles.callbackText, due && styles.dueText]}>
                    {due ? "Due now • " : ""}
                    {formatDate(item.callback_date)}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${item.full_name || item.mobile}`}
                  onPress={(event) => {
                    event.stopPropagation();
                    void callContact(item);
                  }}
                  style={({ pressed }) => [
                    styles.callButton,
                    pressed && styles.callButtonPressed,
                  ]}
                >
                  <Text style={styles.callButtonIcon}>☎</Text>
                  <Text style={styles.callButtonText}>Call</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        }}
      />

      <Modal
        visible={Boolean(selected)}
        transparent
        animationType="slide"
        onRequestClose={closeContact}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <View
                  style={[
                    styles.modalAvatar,
                    { backgroundColor: `${selectedAccent}22` },
                  ]}
                >
                  <Text style={[styles.modalAvatarText, { color: selectedAccent }]}>
                    {contactDisplayName(selected).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.modalHeaderCopy}>
                  <Text style={styles.modalEyebrow}>CALL RESULT</Text>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {contactDisplayName(selected)}
                  </Text>
                  <Text style={styles.modalMobile}>{selected?.mobile}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close call result"
                  onPress={closeContact}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeText}>✕</Text>
                </Pressable>
              </View>

              <Pressable
                disabled={!selected || saving}
                onPress={() => selected && void callContact(selected, false)}
                style={({ pressed }) => [
                  styles.largeCallButton,
                  pressed && styles.callButtonPressed,
                  saving && styles.disabled,
                ]}
              >
                <Text style={styles.largeCallIcon}>☎</Text>
                <View>
                  <Text style={styles.largeCallTitle}>Call Again</Text>
                  <Text style={styles.largeCallSubtitle}>
                    Open phone dialer for {selected?.mobile}
                  </Text>
                </View>
              </Pressable>

              <Text style={styles.label}>SELECT CALL RESULT</Text>
              <View style={styles.statusOptions}>
                {STATUSES.map((item) => {
                  const active = status === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => setStatus(item.key)}
                      style={[
                        styles.statusOption,
                        {
                          backgroundColor: item.color,
                          borderColor: item.color,
                        },
                        active && styles.statusOptionActive,
                      ]}
                    >
                      <Text
                        style={styles.statusOptionIcon}
                      >
                        {item.icon}
                      </Text>
                      <Text
                        style={styles.statusOptionText}
                      >
                        {item.key}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {status === "Callback" && (
                <>
                  <Text style={styles.label}>CALLBACK DATE & TIME</Text>
                  <TextInput
                    value={callbackDate}
                    onChangeText={setCallbackDate}
                    placeholder="2026-08-01T15:30"
                    placeholderTextColor={COLORS.textMuted}
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={styles.fieldHint}>
                    Format: YYYY-MM-DDTHH:mm
                  </Text>
                </>
              )}

              <Text style={styles.label}>CALL REMARKS</Text>
              <TextInput
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Customer response, requirement and next action..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                maxLength={1000}
                style={[styles.input, styles.remarksInput]}
              />
              <Text style={styles.characterCount}>{remarks.length}/1000</Text>

              <Pressable
                disabled={saving}
                onPress={() => void persistOutcome(false)}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                  saving && styles.disabled,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? "Saving Call Result..." : "Save Call Result"}
                </Text>
              </Pressable>

              {status === "Interested" && !selected?.converted_to_lead && (
                <Pressable
                  disabled={saving}
                  onPress={() => void persistOutcome(true)}
                  style={({ pressed }) => [
                    styles.convertButton,
                    pressed && styles.primaryButtonPressed,
                    saving && styles.disabled,
                  ]}
                >
                  <View style={styles.convertIconCircle}>
                    <Text style={styles.convertIcon}>✓</Text>
                  </View>
                  <View style={styles.convertCopy}>
                    <Text style={styles.convertButtonText}>
                      Save & Convert To Lead
                    </Text>
                    <Text style={styles.convertButtonHint}>
                      Creates a segment-specific Lead in CRM
                    </Text>
                  </View>
                  <Text style={styles.convertArrow}>›</Text>
                </Pressable>
              )}

              {selected?.converted_to_lead && (
                <View style={styles.convertedBanner}>
                  <Text style={styles.convertedIcon}>✓</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.convertedTitle}>Already Converted</Text>
                    <Text style={styles.convertedText}>
                      This Raw Contact is linked with an existing Lead.
                    </Text>
                  </View>
                  {!!selected.lead_id && (
                    <Pressable
                      onPress={() => {
                        const leadId = selected.lead_id;
                        setSelected(null);
                        router.push({
                          pathname: "/lead-form",
                          params: { id: leadId ?? "" },
                        });
                      }}
                    >
                      <Text style={styles.openLeadText}>Open Lead</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, padding: SPACING.lg, paddingBottom: 130 },
  heroCard: {
    position: "relative",
    overflow: "hidden",
    marginBottom: SPACING.lg,
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    backgroundColor: "#0B1F35",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    ...SHADOW,
  },
  heroGlow: {
    position: "absolute",
    top: -90,
    right: -55,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(220,38,38,0.20)",
  },
  eyebrow: {
    color: "#FF7B7B",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
  },
  title: {
    marginTop: 7,
    color: COLORS.white,
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  subtitle: {
    marginTop: 7,
    color: COLORS.textMuted,
    fontSize: 12.5,
    lineHeight: 19,
  },
  heroActions: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.xl,
  },
  heroButton: {
    flex: 1,
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(220,38,38,0.16)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.25)",
  },
  callbackHeroButton: {
    backgroundColor: "rgba(59,130,246,0.14)",
    borderColor: "rgba(96,165,250,0.25)",
  },
  heroButtonIcon: { color: COLORS.white, fontSize: 25 },
  heroButtonValue: { color: COLORS.white, fontSize: 20, fontWeight: "900" },
  heroButtonLabel: { marginTop: 1, color: COLORS.textMuted, fontSize: 10 },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  statCard: {
    position: "relative",
    minWidth: 74,
    flexGrow: 1,
    overflow: "hidden",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  statValue: { color: COLORS.white, fontSize: 20, fontWeight: "900" },
  statLabel: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 9.5,
    fontWeight: "700",
  },
  sectionLabel: {
    marginBottom: SPACING.sm,
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  horizontalFilters: {
    gap: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  filterChip: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    ...SOFT_SHADOW,
  },
  filterChipActive: {
    borderWidth: 2,
    borderColor: COLORS.white,
    transform: [{ scale: 1.04 }],
  },
  segmentDot: { width: 7, height: 7, borderRadius: 4 },
  filterText: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
  queueChip: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    ...SOFT_SHADOW,
  },
  queueChipActive: {
    borderWidth: 2,
    borderColor: COLORS.white,
    transform: [{ scale: 1.04 }],
  },
  queueIcon: { color: COLORS.white, fontSize: 13, fontWeight: "900" },
  queueText: { color: COLORS.white, fontSize: 11, fontWeight: "900" },
  listHeadingRow: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listHeading: { color: COLORS.text, fontSize: 17, fontWeight: "900" },
  listCount: { marginTop: 3, color: COLORS.textMuted, fontSize: 10.5 },
  loadingText: {
    marginVertical: SPACING.lg,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  errorBox: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(220,38,38,0.12)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.35)",
  },
  errorText: { color: "#FCA5A5", fontSize: 12 },
  retryText: { marginTop: 4, color: COLORS.primary, fontSize: 11, fontWeight: "800" },
  card: {
    position: "relative",
    overflow: "hidden",
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardAccent: { position: "absolute", top: 0, bottom: 0, left: 0, width: 3 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.md },
  avatar: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
  },
  avatarText: { fontSize: 18, fontWeight: "900" },
  cardCopy: { flex: 1, minWidth: 0 },
  name: { color: COLORS.text, fontSize: 16, fontWeight: "900" },
  mobile: { marginTop: 4, color: COLORS.textSoft, fontSize: 13, fontWeight: "700" },
  location: { marginTop: 4, color: COLORS.textMuted, fontSize: 11 },
  statusBadge: {
    maxWidth: 102,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { color: COLORS.white, fontSize: 9, fontWeight: "900" },
  remarksPreview: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    color: COLORS.textSoft,
    backgroundColor: COLORS.surfaceLight,
    fontSize: 11,
    lineHeight: 17,
  },
  cardFooter: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  footerCopy: { flex: 1 },
  segmentText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  callbackText: { marginTop: 3, color: COLORS.textMuted, fontSize: 9.5 },
  dueText: { color: "#60A5FA", fontWeight: "800" },
  callButton: {
    minWidth: 82,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: RADIUS.md,
    backgroundColor: "#16A34A",
  },
  callButtonIcon: { color: COLORS.white, fontSize: 16 },
  callButtonText: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
  callButtonPressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.76)",
  },
  modalCard: {
    maxHeight: "94%",
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    marginTop: 10,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  modalContent: { padding: SPACING.xl, paddingBottom: 40 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  modalAvatar: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.lg,
  },
  modalAvatarText: { fontSize: 21, fontWeight: "900" },
  modalHeaderCopy: { flex: 1, minWidth: 0 },
  modalEyebrow: {
    color: COLORS.primary,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  modalTitle: { marginTop: 3, color: COLORS.text, fontSize: 20, fontWeight: "900" },
  modalMobile: { marginTop: 3, color: COLORS.textMuted, fontSize: 12.5 },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceLight,
  },
  closeText: { color: COLORS.textMuted, fontSize: 17, fontWeight: "800" },
  largeCallButton: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.info,
    borderWidth: 1,
    borderColor: "#1D4ED8",
    ...SHADOW,
  },
  largeCallIcon: { color: COLORS.white, fontSize: 26 },
  largeCallTitle: { color: COLORS.white, fontSize: 14, fontWeight: "900" },
  largeCallSubtitle: { marginTop: 3, color: "#DBEAFE", fontSize: 10.5 },
  label: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  statusOptions: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  statusOption: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusOptionActive: {
    borderWidth: 2,
    borderColor: COLORS.white,
    transform: [{ scale: 1.05 }],
    ...SOFT_SHADOW,
  },
  statusOptionIcon: { color: COLORS.white, fontSize: 13, fontWeight: "900" },
  statusOptionText: { color: COLORS.white, fontSize: 9.5, fontWeight: "900" },
  input: {
    minHeight: 50,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  remarksInput: { minHeight: 100, paddingTop: SPACING.md, textAlignVertical: "top" },
  fieldHint: { marginTop: 5, color: COLORS.textMuted, fontSize: 9.5 },
  characterCount: { marginTop: 5, color: COLORS.textMuted, fontSize: 9, textAlign: "right" },
  primaryButton: {
    minHeight: 52,
    marginTop: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  primaryButtonPressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
  primaryButtonText: { color: COLORS.white, fontWeight: "900", fontSize: 13 },
  convertButton: {
    minHeight: 68,
    marginTop: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(16,185,129,0.15)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.38)",
  },
  convertIconCircle: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
    backgroundColor: "#10B981",
  },
  convertIcon: { color: COLORS.white, fontSize: 17, fontWeight: "900" },
  convertCopy: { flex: 1 },
  convertButtonText: { color: "#6EE7B7", fontWeight: "900", fontSize: 13 },
  convertButtonHint: { marginTop: 3, color: COLORS.textMuted, fontSize: 9.5 },
  convertArrow: { color: "#6EE7B7", fontSize: 28, fontWeight: "300" },
  convertedBanner: {
    marginTop: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(16,185,129,0.10)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.28)",
  },
  convertedIcon: { color: "#34D399", fontSize: 18, fontWeight: "900" },
  convertedTitle: { color: "#6EE7B7", fontSize: 12, fontWeight: "900" },
  convertedText: { marginTop: 2, color: COLORS.textMuted, fontSize: 9.5 },
  openLeadText: { color: "#6EE7B7", fontSize: 10, fontWeight: "900" },
  disabled: { opacity: 0.52 },
});
