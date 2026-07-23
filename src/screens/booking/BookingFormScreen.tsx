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
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import {
  addBooking,
  BookingStatus,
  getBookingById,
  updateBooking,
} from "../../storage/bookingStorage";

const STATUS_OPTIONS: BookingStatus[] = [
  "New",
  "Token Received",
  "Agreement Pending",
  "Registered",
  "Cancelled",
];

export default function BookingFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const bookingId = typeof params.id === "string" ? params.id : "";

  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [propertyLocation, setPropertyLocation] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<BookingStatus>("New");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!bookingId) return;

      void (async () => {
        const booking = await getBookingById(bookingId);
        if (!booking) return;

        setCustomerName(booking.customerName);
        setCustomerMobile(booking.customerMobile);
        setPropertyName(booking.propertyName);
        setPropertyLocation(booking.propertyLocation);
        setTotalAmount(String(booking.totalAmount));
        setTokenAmount(String(booking.tokenAmount));
        setReceivedAmount(String(booking.receivedAmount));
        setBookingDate(booking.bookingDate);
        setStatus(booking.status);
        setNotes(booking.notes);
      })();
    }, [bookingId])
  );

  const save = async () => {
    const mobile = customerMobile.replace(/\D/g, "");
    const total = Number(totalAmount || 0);
    const token = Number(tokenAmount || 0);
    const received = Number(receivedAmount || 0);

    if (!customerName.trim()) {
      Alert.alert("Customer Required", "Customer name enter karein.");
      return;
    }
    if (mobile.length !== 10) {
      Alert.alert("Invalid Mobile", "10 digit mobile number enter karein.");
      return;
    }
    if (!propertyName.trim()) {
      Alert.alert("Property Required", "Property name enter karein.");
      return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      Alert.alert("Invalid Amount", "Total booking amount enter karein.");
      return;
    }
    if (Math.max(received, token) > total) {
      Alert.alert("Invalid Payment", "Received amount total amount se zyada nahi ho sakta.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        customerName,
        customerMobile: mobile,
        propertyName,
        propertyLocation,
        totalAmount: total,
        tokenAmount: token,
        receivedAmount: Math.max(received, token),
        bookingDate,
        status,
        notes,
      };

      if (bookingId) await updateBooking(bookingId, payload);
      else await addBooking(payload);

      router.replace("/bookings" as never);
    } catch (error) {
      console.error(error);
      Alert.alert("Save Failed", "Booking save nahi ho saki.");
    } finally {
      setSaving(false);
    }
  };

  const numericInput = (value: string, onChange: (text: string) => void) => (
    <TextInput
      value={value}
      onChangeText={(text) => onChange(text.replace(/[^0-9.]/g, ""))}
      keyboardType="numeric"
      placeholderTextColor={COLORS.textMuted}
      style={styles.input}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader segment={bookingId ? "Edit Booking" : "New Booking"} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>Customer Details</Text>

          <Text style={styles.label}>Customer Name *</Text>
          <TextInput
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Customer full name"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          <Text style={styles.label}>Mobile Number *</Text>
          <TextInput
            value={customerMobile}
            onChangeText={(text) => setCustomerMobile(text.replace(/\D/g, "").slice(0, 10))}
            keyboardType="phone-pad"
            placeholder="10 digit mobile number"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          <Text style={styles.sectionTitle}>Property Details</Text>

          <Text style={styles.label}>Property / Project *</Text>
          <TextInput
            value={propertyName}
            onChangeText={setPropertyName}
            placeholder="Example: JMK Row House 15x50"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            value={propertyLocation}
            onChangeText={setPropertyLocation}
            placeholder="Property location"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          <Text style={styles.sectionTitle}>Payment Details</Text>

          <Text style={styles.label}>Total Booking Amount *</Text>
          {numericInput(totalAmount, setTotalAmount)}

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <Text style={styles.label}>Token Amount</Text>
              {numericInput(tokenAmount, setTokenAmount)}
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Total Received</Text>
              {numericInput(receivedAmount, setReceivedAmount)}
            </View>
          </View>

          <Text style={styles.label}>Booking Date</Text>
          <TextInput
            value={bookingDate}
            onChangeText={setBookingDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          <Text style={styles.label}>Booking Status</Text>
          <View style={styles.optionWrap}>
            {STATUS_OPTIONS.map((option) => (
              <Pressable
                key={option}
                style={[styles.option, status === option && styles.optionActive]}
                onPress={() => setStatus(option)}
              >
                <Text style={[styles.optionText, status === option && styles.optionTextActive]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Booking notes"
            placeholderTextColor={COLORS.textMuted}
            style={[styles.input, styles.notesInput]}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.saveButton, saving && styles.disabled]} onPress={save} disabled={saving}>
              <Text style={styles.saveText}>{saving ? "Saving..." : "Save Booking"}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  container: { padding: SPACING.lg, paddingBottom: 60 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: "900", marginTop: SPACING.lg, marginBottom: SPACING.sm },
  label: { color: COLORS.textMuted, fontSize: 12, fontWeight: "700", marginTop: SPACING.md, marginBottom: 7 },
  input: { minHeight: 50, backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: RADIUS.md, color: COLORS.text, paddingHorizontal: 14, paddingVertical: 12 },
  notesInput: { minHeight: 100 },
  twoColumn: { flexDirection: "row", gap: SPACING.md },
  column: { flex: 1 },
  optionWrap: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  option: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: RADIUS.round, paddingHorizontal: 13, paddingVertical: 9 },
  optionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionText: { color: COLORS.textMuted, fontSize: 11, fontWeight: "800" },
  optionTextActive: { color: COLORS.white },
  actions: { flexDirection: "row", gap: SPACING.md, marginTop: SPACING.xl },
  cancelButton: { flex: 1, minHeight: 52, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  cancelText: { color: COLORS.text, fontWeight: "900" },
  saveButton: { flex: 2, minHeight: 52, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  saveText: { color: COLORS.white, fontWeight: "900" },
  disabled: { opacity: 0.6 },
});
