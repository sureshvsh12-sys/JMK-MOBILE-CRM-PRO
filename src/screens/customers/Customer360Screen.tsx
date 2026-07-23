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
import CustomerTimeline from "../../components/customer/CustomerTimeline";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import {
  addCustomerActivity,
  CustomerActivity,
  getCustomerActivities,
} from "../../storage/customerActivityStorage";
import { getCustomerById } from "../../storage/customerStorage";
import { Customer } from "../../types/customer";

export default function Customer360Screen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const customerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [note, setNote] = useState("");

  const loadData = useCallback(async () => {
    if (!customerId) return;
    const currentCustomer = await getCustomerById(customerId);
    setCustomer(currentCustomer);
    setActivities(await getCustomerActivities(customerId));
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
    await addCustomerActivity(customerId, type, title);
    await loadData();
    await Linking.openURL(url);
  };

  const addNote = async () => {
    if (!customerId || !note.trim()) return;
    await addCustomerActivity(customerId, "note", "Customer Note", note.trim());
    setNote("");
    await loadData();
  };

  if (!customerId || !customer) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Customer 360°</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.center}>
          <Text style={styles.empty}>Customer record not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Customer 360°</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <CustomerProfileCard
          customer={customer}
          onEdit={() =>
            router.push({ pathname: "/customer-form", params: { id: customer.id } } as never)
          }
          onCall={() =>
            void recordAndOpen("call", `tel:${customer.mobile}`, "Outgoing Call")
          }
          onWhatsApp={() =>
            void recordAndOpen(
              "whatsapp",
              `https://wa.me/91${customer.mobile}`,
              "WhatsApp Opened"
            )
          }
        />

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activities.length}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {activities.filter((item) => item.type === "call").length}
            </Text>
            <Text style={styles.statLabel}>Calls</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {activities.filter((item) => item.type === "note").length}
            </Text>
            <Text style={styles.statLabel}>Notes</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Activity Note</Text>
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
          <Text style={styles.sectionTitle}>Customer Timeline</Text>
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { color: COLORS.textMuted },
  statsRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: "center" },
  statValue: { color: COLORS.text, fontSize: 22, fontWeight: "900" },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 3 },
  section: { marginTop: SPACING.xl },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: "900", marginBottom: SPACING.md },
  noteInput: { minHeight: 90, color: COLORS.text, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, textAlignVertical: "top" },
  noteButton: { alignSelf: "flex-end", marginTop: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 18, paddingVertical: 11 },
  noteButtonText: { color: COLORS.white, fontWeight: "900" },
});
