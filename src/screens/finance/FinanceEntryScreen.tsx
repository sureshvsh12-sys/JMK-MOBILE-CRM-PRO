import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../../components/AppHeader";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import {
  getFinanceEntry,
  saveFinanceEntry,
} from "../../storage/financeStorage";
import type { FinanceCategory, FinanceEntryType } from "../../storage/financeStorage";

const TYPES: FinanceEntryType[] = ["Income", "Expense"];
const CATEGORIES: FinanceCategory[] = [
  "Booking",
  "Commission",
  "Loan Service",
  "Solar",
  "Office",
  "Salary",
  "Marketing",
  "Travel",
  "Other",
];
const PAYMENT_MODES = ["Cash", "UPI", "Bank", "Cheque", "Other"] as const;

export default function FinanceEntryScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : undefined;

  const [type, setType] = useState<FinanceEntryType>("Income");
  const [category, setCategory] = useState<FinanceCategory>("Booking");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [partyName, setPartyName] = useState("");
  const [paymentMode, setPaymentMode] = useState<(typeof PAYMENT_MODES)[number]>("Cash");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const entry = await getFinanceEntry(id);
      if (!entry) return;
      setType(entry.type);
      setCategory(entry.category);
      setAmount(String(entry.amount));
      setTitle(entry.title);
      setPartyName(entry.partyName);
      setPaymentMode(entry.paymentMode);
      setEntryDate(entry.entryDate);
      setNotes(entry.notes);
    })();
  }, [id]);

  const submit = async () => {
    const numericAmount = Number(amount.replace(/,/g, ""));
    if (!title.trim()) {
      Alert.alert("Title Required", "Entry ka title likhiye.");
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert("Invalid Amount", "Sahi amount enter kijiye.");
      return;
    }
    const parsedDate = new Date(`${entryDate}T00:00:00`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(entryDate) ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== entryDate
    ) {
      Alert.alert("Invalid Date", "Valid date YYYY-MM-DD format me likhiye.");
      return;
    }

    setSaving(true);
    try {
      await saveFinanceEntry({
        id,
        type,
        category,
        amount: numericAmount,
        title: title.trim(),
        partyName: partyName.trim(),
        paymentMode,
        entryDate,
        notes: notes.trim(),
      });
      router.back();
    } catch {
      Alert.alert("Save Failed", "Finance entry save nahi hui. Dobara try kijiye.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader segment={id ? "Edit Finance Entry" : "New Finance Entry"} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Entry Type</Text>
          <View style={styles.segmentRow}>
            {TYPES.map((item) => (
              <Pressable
                key={item}
                style={[
                  styles.segment,
                  type === item &&
                    (item === "Income" ? styles.incomeActive : styles.expenseActive),
                ]}
                onPress={() => setType(item)}
              >
                <Text style={[styles.segmentText, type === item && styles.segmentTextActive]}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <Field label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. Booking payment" />
          <Field
            label="Amount *"
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            keyboardType="numeric"
          />
          <Field
            label="Party / Customer"
            value={partyName}
            onChangeText={setPartyName}
            placeholder="Customer or vendor name"
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((item) => (
              <Pressable
                key={item}
                style={[styles.chip, category === item && styles.chipActive]}
                onPress={() => setCategory(item)}
              >
                <Text style={[styles.chipText, category === item && styles.chipTextActive]}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Payment Mode</Text>
          <View style={styles.chips}>
            {PAYMENT_MODES.map((item) => (
              <Pressable
                key={item}
                style={[styles.chip, paymentMode === item && styles.chipActive]}
                onPress={() => setPaymentMode(item)}
              >
                <Text style={[styles.chipText, paymentMode === item && styles.chipTextActive]}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <Field
            label="Entry Date"
            value={entryDate}
            onChangeText={setEntryDate}
            placeholder="YYYY-MM-DD"
          />
          <Field
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes"
            multiline
          />

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.saveButton, saving && styles.disabledButton]}
              disabled={saving}
              onPress={() => void submit()}
            >
              <Text style={styles.saveText}>{saving ? "Saving..." : "Save Entry"}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  multiline = false,
  ...props
}: ComponentProps<typeof TextInput> & { label: string; multiline?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={COLORS.textMuted}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  label: { color: COLORS.text, fontSize: 12, fontWeight: "800", marginBottom: 8 },
  field: { marginTop: SPACING.lg },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    paddingHorizontal: 15,
  },
  multilineInput: { minHeight: 100, paddingTop: 14, textAlignVertical: "top" },
  segmentRow: { flexDirection: "row", gap: SPACING.sm },
  segment: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
  },
  incomeActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  expenseActive: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  segmentText: { color: COLORS.textMuted, fontWeight: "900" },
  segmentTextActive: { color: COLORS.white },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.md },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textMuted, fontSize: 11, fontWeight: "800" },
  chipTextActive: { color: COLORS.white },
  actions: { flexDirection: "row", gap: SPACING.md, marginTop: SPACING.xl },
  cancelButton: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
  },
  cancelText: { color: COLORS.text, fontWeight: "900" },
  saveButton: {
    flex: 2,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },
  disabledButton: { opacity: 0.6 },
  saveText: { color: COLORS.white, fontWeight: "900" },
});
