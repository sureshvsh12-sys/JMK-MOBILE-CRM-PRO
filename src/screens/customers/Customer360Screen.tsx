import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackButton from "../../components/BackButton";
import EmptyState from "../../components/common/EmptyState";
import ScreenSectionHeader from "../../components/common/ScreenSectionHeader";
import CustomerProfileCard from "../../components/customer/CustomerProfileCard";
import CustomerTimeline from "../../components/customer/CustomerTimeline";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import { fetchCustomer360Summary } from "../../services/customer360Service";
import {
  addCustomerActivity,
  type CustomerActivity,
  getCustomerActivities,
} from "../../storage/customerActivityStorage";
import { getCustomerById } from "../../storage/customerStorage";
import type { Customer, Customer360Summary } from "../../types/customer";

const EMPTY_SUMMARY: Customer360Summary = {
  followUps: 0,
  quotations: 0,
  payments: 0,
  calls: 0,
};

function cleanPhone(value: string): string {
  return String(value || "").replace(/\D/g, "");
}

export default function Customer360Screen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const customerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [summary, setSummary] = useState<Customer360Summary>(EMPTY_SUMMARY);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      setError("");
      const [currentCustomer, localActivities, linkedSummary] = await Promise.all([
        getCustomerById(customerId),
        getCustomerActivities(customerId),
        fetchCustomer360Summary(customerId),
      ]);

      setCustomer(currentCustomer);
      setActivities(localActivities);
      setSummary(linkedSummary);
    } catch (loadError) {
      console.error("Unable to load Customer 360:", loadError);
      setError("Customer 360 data load nahi ho saka.");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const recordAndOpen = async (
    type: "call" | "whatsapp",
    title: string,
  ) => {
    if (!customerId || !customer) return;

    const mobile = cleanPhone(customer.mobile);
    if (!mobile) {
      Alert.alert("Mobile Missing", "Customer mobile number available nahi hai.");
      return;
    }

    const normalizedMobile = mobile.length === 10 ? `91${mobile}` : mobile;
    const url = type === "call" ? `tel:${mobile}` : `https://wa.me/${normalizedMobile}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Not Available", "Required action is device par available nahi hai.");
        return;
      }

      await addCustomerActivity(customerId, type, title);
      await loadData();
      await Linking.openURL(url);
    } catch (actionError) {
      console.error("Unable to complete customer action:", actionError);
      Alert.alert("Action Failed", "Customer action complete nahi ho saka.");
    }
  };

  const addNote = async () => {
    const cleanNote = note.trim();
    if (!customerId || !cleanNote || savingNote) return;

    try {
      setSavingNote(true);
      await addCustomerActivity(customerId, "note", "Customer Note", cleanNote);
      setNote("");
      await loadData();
    } catch (noteError) {
      console.error("Unable to add customer note:", noteError);
      Alert.alert("Save Failed", "Customer note save nahi ho saka.");
    } finally {
      setSavingNote(false);
    }
  };

  const totalActivity = useMemo(
    () => summary.followUps + summary.quotations + summary.payments + summary.calls,
    [summary],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header />
        <View style={styles.loadingWrap}>
          {[0, 1, 2].map((item) => (
            <View key={item} style={styles.skeleton} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (!customerId || !customer) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header />
        <EmptyState
          icon="◉"
          title="Customer Not Found"
          message={error || "Customer record available nahi hai."}
          actionLabel="Back to Customers"
          onActionPress={() => router.replace("/customers" as never)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <Pressable style={styles.errorBox} onPress={() => void loadData()}>
            <Text style={styles.errorText}>{error} Tap to retry.</Text>
          </Pressable>
        ) : null}

        <CustomerProfileCard
          customer={customer}
          onEdit={() =>
            router.push({
              pathname: "/customer-form",
              params: { id: customer.id },
            } as never)
          }
          onCall={() => void recordAndOpen("call", "Outgoing Call")}
          onWhatsApp={() => void recordAndOpen("whatsapp", "WhatsApp Opened")}
        />

        <View style={styles.overviewCard}>
          <View>
            <Text style={styles.overviewEyebrow}>CUSTOMER OVERVIEW</Text>
            <Text style={styles.overviewTitle}>{customer.name}</Text>
            <Text style={styles.overviewSub}>Total linked activity: {totalActivity}</Text>
          </View>
          <View style={styles.segmentPill}>
            <Text style={styles.segmentText}>{customer.segment}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Follow-ups" value={summary.followUps} color="#2563EB" />
          <StatCard label="Quotations" value={summary.quotations} color="#7C3AED" />
          <StatCard label="Payments" value={summary.payments} color="#16A34A" />
          <StatCard label="Calls" value={summary.calls} color="#F59E0B" />
        </View>

        <View style={styles.linkedCard}>
          <Text style={styles.linkedTitle}>Linked Record</Text>
          <LinkedRow label="Lead ID" value={customer.leadId || "Not linked"} />
          <LinkedRow label="Raw Contact ID" value={customer.rawContactId || "Not linked"} />
          <LinkedRow label="Source" value={customer.source || "Unknown"} />
        </View>

        <View style={styles.section}>
          <ScreenSectionHeader
            title="Add Activity Note"
            subtitle="Meeting, requirement ya follow-up details save karein."
          />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Meeting, requirement or follow-up note"
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={500}
            style={styles.noteInput}
          />
          <View style={styles.noteFooter}>
            <Text style={styles.characterCount}>{note.length}/500</Text>
            <Pressable
              disabled={!note.trim() || savingNote}
              style={({ pressed }) => [
                styles.noteButton,
                (!note.trim() || savingNote) && styles.disabled,
                pressed && styles.pressed,
              ]}
              onPress={() => void addNote()}
            >
              <Text style={styles.noteButtonText}>
                {savingNote ? "Saving..." : "Save Note"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <ScreenSectionHeader
            title="Customer Timeline"
            subtitle={`${activities.length} mobile activities`}
          />
          <CustomerTimeline activities={activities} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <BackButton compact fallbackRoute="/customers" />
      <Text style={styles.headerTitle}>Customer 360°</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={[styles.statBar, { backgroundColor: color }]} />
    </View>
  );
}

function LinkedRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.linkedRow}>
      <Text style={styles.linkedLabel}>{label}</Text>
      <Text style={styles.linkedValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: { minHeight: 62, paddingHorizontal: SPACING.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  headerSpacer: { width: 48 },
  loadingWrap: { padding: SPACING.lg, gap: SPACING.md },
  skeleton: { height: 130, borderRadius: RADIUS.lg, backgroundColor: COLORS.surface },
  content: { padding: SPACING.lg, paddingBottom: 70 },
  errorBox: { borderWidth: 1, borderColor: COLORS.danger, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, backgroundColor: "#DC262614" },
  errorText: { color: COLORS.danger, fontWeight: "700" },
  overviewCard: { marginTop: SPACING.md, padding: SPACING.lg, borderRadius: RADIUS.lg, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center", ...SHADOW },
  overviewEyebrow: { color: COLORS.primary, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  overviewTitle: { marginTop: 5, color: COLORS.text, fontSize: 18, fontWeight: "900" },
  overviewSub: { marginTop: 4, color: COLORS.textMuted, fontSize: 10 },
  segmentPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.round, backgroundColor: COLORS.primarySoft },
  segmentText: { color: COLORS.primary, fontSize: 10, fontWeight: "900" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginTop: SPACING.md },
  statCard: { width: "48%", flexGrow: 1, overflow: "hidden", backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: "center", ...SHADOW },
  statValue: { fontSize: 22, fontWeight: "900" },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 3 },
  statBar: { position: "absolute", left: 0, right: 0, bottom: 0, height: 3 },
  linkedCard: { marginTop: SPACING.md, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md },
  linkedTitle: { color: COLORS.text, fontSize: 14, fontWeight: "900", marginBottom: SPACING.sm },
  linkedRow: { flexDirection: "row", justifyContent: "space-between", gap: SPACING.md, paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  linkedLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700" },
  linkedValue: { flex: 1, color: COLORS.text, fontSize: 11, fontWeight: "800", textAlign: "right" },
  section: { marginTop: SPACING.xl },
  noteInput: { minHeight: 100, color: COLORS.text, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, textAlignVertical: "top" },
  noteFooter: { marginTop: SPACING.sm, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  characterCount: { color: COLORS.textMuted, fontSize: 10 },
  noteButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 18, paddingVertical: 11 },
  noteButtonText: { color: COLORS.white, fontWeight: "900" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
