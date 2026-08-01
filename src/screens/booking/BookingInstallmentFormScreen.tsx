import { useCallback, useState } from "react";
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
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../../components/AppHeader";
import BackButton from "../../components/BackButton";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { Booking, getBookingById } from "../../storage/bookingStorage";
import {
  addBookingInstallment,
  getBookingInstallmentById,
  updateBookingInstallment,
} from "../../storage/bookingInstallmentStorage";

export default function BookingInstallmentFormScreen() {
  const params = useLocalSearchParams<{ bookingId?: string; id?: string }>();
  const bookingId = typeof params.bookingId === "string" ? params.bookingId : "";
  const installmentId = typeof params.id === "string" ? params.id : "";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (bookingId) void getBookingById(bookingId).then(setBooking);
      if (installmentId) {
        void getBookingInstallmentById(installmentId).then((item) => {
          if (!item) return;
          setTitle(item.title);
          setAmount(String(item.amount));
          setDueDate(item.dueDate);
          setNotes(item.notes);
        });
      }
    }, [bookingId, installmentId])
  );

  const save = async () => {
    const numericAmount = Number(amount.replace(/,/g, ""));
    if (!bookingId || !booking) {
      Alert.alert("Error", "Booking not found.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Required", "Installment title enter karein.");
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert("Invalid Amount", "Valid installment amount enter karein.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        bookingId,
        title: title.trim(),
        amount: numericAmount,
        dueDate,
        notes: notes.trim(),
      };

      if (installmentId) {
        await updateBookingInstallment(installmentId, payload);
      } else {
        await addBookingInstallment(payload);
      }
      router.back();
    } catch (error) {
      Alert.alert(
        "Unable to Save",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader segment="Booking Installment" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BackButton fallbackRoute="/bookings" />

          <View style={styles.bookingCard}>
            <Text style={styles.bookingName}>{booking?.customerName || "Booking"}</Text>
            <Text style={styles.bookingMeta}>{booking?.propertyName || ""}</Text>
            <Text style={styles.balanceText}>
              Balance: ₹{(booking?.balanceAmount || 0).toLocaleString("en-IN")}
            </Text>
          </View>

          <Text style={styles.label}>Installment Title *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Example: First Installment"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          <Text style={styles.label}>Amount *</Text>
          <TextInput
            value={amount}
            onChangeText={(value) => setAmount(value.replace(/[^0-9.]/g, ""))}
            placeholder="Enter amount"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>Due Date *</Text>
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes"
            placeholderTextColor={COLORS.textMuted}
            multiline
            style={[styles.input, styles.notesInput]}
          />

          <Pressable
            disabled={saving}
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={save}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : installmentId ? "Update Installment" : "Save Installment"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: 40 },
  backText: { color: COLORS.primary, fontSize: 17, fontWeight: "700", marginBottom: SPACING.md },
  bookingCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg },
  bookingName: { color: COLORS.text, fontSize: 20, fontWeight: "900" },
  bookingMeta: { color: COLORS.textMuted, marginTop: 5 },
  balanceText: { color: COLORS.danger, marginTop: 12, fontWeight: "800" },
  label: { color: COLORS.text, fontWeight: "700", marginBottom: 7, marginTop: 14 },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, color: COLORS.text, paddingHorizontal: 14, paddingVertical: 13 },
  notesInput: { minHeight: 100, textAlignVertical: "top" },
  saveButton: { marginTop: 24, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: "center" },
  disabledButton: { opacity: 0.6 },
  saveButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
});
