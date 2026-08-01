import { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomerProfileCard from "../../components/customer/CustomerProfileCard";
import BackButton from "../../components/BackButton";
import EmptyState from "../../components/common/EmptyState";
import ScreenSectionHeader from "../../components/common/ScreenSectionHeader";
import CustomerTimeline from "../../components/customer/CustomerTimeline";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { fetchCustomer360Summary } from "../../services/customer360Service";
import {
  addCustomerActivity,
  CustomerActivity,
  getCustomerActivities,
} from "../../storage/customerActivityStorage";
import { getCustomerById } from "../../storage/customerStorage";
import { Customer, Customer360Summary } from "../../types/customer";

const EMPTY_SUMMARY: Customer360Summary = {
  followUps: 0,
  quotations: 0,
  payments: 0,
  calls: 0,
};

export default function Customer360Screen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const customerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [summary, setSummary] = useState<Customer360Summary>(EMPTY_SUMMARY);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!customerId) return;

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
    }, [loadData])
  );

  const recordAndOpen = async (
    type: "call" | "whatsapp",
    url: string,
    title: string
  ) => {
    if (!customerId) return;

    try {
      if (!(await Linking.canOpenURL(url))) {
        Alert.alert("Not Available", "Required app is device par available nahi hai.");
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
    if (!customerId || !cleanNote) return;

    try {
      await addCustomerActivity(customerId, "note", "Customer Note", cleanNote);
      setNote("");
      await loadData();
    } catch (noteError) {
      console.error("Unable to add customer note:", noteError);
      Alert.alert("Save Failed", "Customer note save nahi ho saka.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <BackButton compact fallbackRoute="/customers" />
          <Text style={styles.headerTitle}>Customer 360°</Text>
          <View style={styles.headerSpacer} />
        </View>
        <EmptyState icon="◉" title="Loading Customer" message="Supabase se complete customer profile load ho rahi hai." />
      </SafeAreaView>
    );
  }

  if (!customerId || !customer) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <BackButton compact fallbackRoute="/customers" />
          <Text style={styles.headerTitle}>Customer 360°</Text>
          <View style={styles.headerSpacer} />
        </View>
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
      <View style={styles.header}>
        <BackButton compact fallbackRoute="/customers" />
        <Text style={styles.headerTitle}>Customer 360°</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!!error && (
          <Pressable style={styles.errorBox} onPress={() => void loadData()}>
            <Text style={styles.errorText}>{error} Tap to retry.</Text>
          </Pressable>
        )}

        <CustomerProfileCard
          customer={customer}
          onEdit={() => router.push({ pathname: "/customer-form", params: { id: customer.id } } as never)}
          onCall={() => void recordAndOpen("call", `tel:${customer.mobile}`, "Outgoing Call")}
          onWhatsApp={() => void recordAndOpen("whatsapp", `https://wa.me/91${customer.mobile}`, "WhatsApp Opened")}
        />

        <View style={styles.statsGrid}>
          <View style={styles.statCard}><Text style={styles.statValue}>{summary.followUps}</Text><Text style={styles.statLabel}>Follow-ups</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{summary.quotations}</Text><Text style={styles.statLabel}>Quotations</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{summary.payments}</Text><Text style={styles.statLabel}>Payments</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{summary.calls}</Text><Text style={styles.statLabel}>Calls</Text></View>
        </View>

        <View style={styles.linkedCard}>
          <Text style={styles.linkedTitle}>Linked Record</Text>
          <Text style={styles.linkedText}>Lead ID: {customer.leadId || "Not linked"}</Text>
          <Text style={styles.linkedText}>Raw Contact ID: {customer.rawContactId || "Not linked"}</Text>
          <Text style={styles.linkedText}>Source: {customer.source}</Text>
        </View>

        <View style={styles.section}>
          <ScreenSectionHeader title="Add Activity Note" subtitle="Meeting, requirement ya follow-up details save karein." />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Meeting, requirement or follow-up note"
            placeholderTextColor={COLORS.textMuted}
            multiline
            style={styles.noteInput}
          />
          <Pressable style={styles.noteButton} onPress={() => void addNote()}>
            <Text style={styles.noteButtonText}>Save Note</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <ScreenSectionHeader title="Customer Timeline" subtitle={`${activities.length} mobile activities`} />
          <CustomerTimeline activities={activities} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: { minHeight: 62, paddingHorizontal: SPACING.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back: { color: COLORS.primary, fontSize: 16, fontWeight: "900" },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  headerSpacer: { width: 48 },
  content: { padding: SPACING.lg, paddingBottom: 50 },
  errorBox: { borderWidth: 1, borderColor: COLORS.danger, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  errorText: { color: COLORS.danger, fontWeight: "700" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginTop: SPACING.md },
  statCard: { width: "48%", flexGrow: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: "center" },
  statValue: { color: COLORS.text, fontSize: 22, fontWeight: "900" },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 3 },
  linkedCard: { marginTop: SPACING.md, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md },
  linkedTitle: { color: COLORS.text, fontSize: 14, fontWeight: "900", marginBottom: SPACING.sm },
  linkedText: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  section: { marginTop: SPACING.xl },
  noteInput: { minHeight: 90, color: COLORS.text, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, textAlignVertical: "top" },
  noteButton: { alignSelf: "flex-end", marginTop: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 18, paddingVertical: 11 },
  noteButtonText: { color: COLORS.white, fontWeight: "900" },
});
