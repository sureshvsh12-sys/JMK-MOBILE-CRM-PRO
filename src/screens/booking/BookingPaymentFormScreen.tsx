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
  addBookingPayment,
  BookingPaymentMode,
} from "../../storage/bookingPaymentStorage";

const MODES: BookingPaymentMode[] = ["Cash", "UPI", "Bank Transfer", "Cheque"];

export default function BookingPaymentFormScreen() {
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId = typeof params.bookingId === "string" ? params.bookingId : "";
  const [booking, setBooking] = useState<Booking | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<BookingPaymentMode>("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (bookingId) void getBookingById(bookingId).then(setBooking);
    }, [bookingId])
  );

  const save = async () => {
    const numericAmount = Number(amount.replace(/,/g, ""));
    if (!bookingId || !booking) {
      Alert.alert("Error", "Booking not found.");
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert("Invalid amount", "Sahi payment amount enter karein.");
      return;
    }
    if (numericAmount > booking.balanceAmount) {
      Alert.alert("Invalid amount", "Payment booking balance se zyada nahi ho sakta.");
      return;
    }

    try {
      setSaving(true);
      await addBookingPayment({
        bookingId,
        amount: numericAmount,
        paymentDate,
        mode,
        referenceNumber,
        notes,
      });
      Alert.alert("Payment Saved", "Booking payment successfully save ho gaya.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Unable to save", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader segment="Add Booking Payment" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <BackButton label="Payments" fallbackRoute="/bookings" />

          <View style={styles.bookingCard}>
            <Text style={styles.customerName}>{booking?.customerName || "Loading booking..."}</Text>
            <Text style={styles.property}>{booking?.propertyName || ""}</Text>
            <Text style={styles.balance}>Balance: ₹{(booking?.balanceAmount || 0).toLocaleString("en-IN")}</Text>
          </View>

          <Text style={styles.label}>Payment Amount *</Text>
          <TextInput
            value={amount}
            onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ""))}
            keyboardType="numeric"
            placeholder="Example: 50000"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          <Text style={styles.label}>Payment Date *</Text>
          <TextInput
            value={paymentDate}
            onChangeText={setPaymentDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          <Text style={styles.label}>Payment Mode</Text>
          <View style={styles.modeWrap}>
            {MODES.map((item) => (
              <Pressable
                key={item}
                style={[styles.modeButton, mode === item && styles.modeButtonActive]}
                onPress={() => setMode(item)}>
                <Text style={[styles.modeText, mode === item && styles.modeTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Reference / Transaction Number</Text>
          <TextInput
            value={referenceNumber}
            onChangeText={setReferenceNumber}
            placeholder="Optional"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Payment details"
            placeholderTextColor={COLORS.textMuted}
            multiline
            style={[styles.input, styles.notesInput]}
          />

          <Pressable
            disabled={saving}
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={save}>
            <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save Payment"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  container: { padding: SPACING.md, paddingBottom: 40 },
  backText: { color: COLORS.primary, fontSize: 16, fontWeight: "700", marginBottom: SPACING.md },
  bookingCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg },
  customerName: { color: COLORS.text, fontSize: 19, fontWeight: "900" },
  property: { color: COLORS.textMuted, marginTop: 4 },
  balance: { color: COLORS.danger, marginTop: 12, fontSize: 15, fontWeight: "800" },
  label: { color: COLORS.text, fontWeight: "700", marginBottom: 7, marginTop: 12 },
  input: { backgroundColor: COLORS.surface, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16 },
  notesInput: { minHeight: 90, textAlignVertical: "top" },
  modeWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modeButton: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 13, paddingVertical: 10 },
  modeButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  modeText: { color: COLORS.text, fontWeight: "700" },
  modeTextActive: { color: "#FFFFFF" },
  saveButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: "center", marginTop: 24 },
  disabledButton: { opacity: 0.6 },
  saveButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
});
