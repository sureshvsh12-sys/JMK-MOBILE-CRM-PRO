import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../../components/AppHeader";
import BackButton from "../../components/BackButton";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { Booking, getBookingById } from "../../storage/bookingStorage";
import {
  BookingPayment,
  deleteBookingPayment,
  getBookingPayments,
} from "../../storage/bookingPaymentStorage";

function formatAmount(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function BookingPaymentListScreen() {
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId = typeof params.bookingId === "string" ? params.bookingId : "";
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payments, setPayments] = useState<BookingPayment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!bookingId) return;
    const [bookingData, paymentData] = await Promise.all([
      getBookingById(bookingId),
      getBookingPayments(bookingId),
    ]);
    setBooking(bookingData);
    setPayments(paymentData);
  }, [bookingId]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const paymentTotal = useMemo(
    () => payments.reduce((total, payment) => total + payment.amount, 0),
    [payments]
  );

  const handleDelete = (payment: BookingPayment) => {
    Alert.alert("Delete Payment", `${formatAmount(payment.amount)} ka payment delete karna hai?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteBookingPayment(payment.id);
          await loadData();
        },
      },
    ]);
  };

  if (!bookingId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <AppHeader segment="Booking Payments" />
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Booking not selected</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.replace("/bookings" as never)}>
            <Text style={styles.primaryButtonText}>Open Bookings</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader segment="Booking Payments" />
      <View style={styles.container}>
        <View style={styles.headingRow}>
          <BackButton compact />
          <Pressable
            style={styles.addButton}
            onPress={() =>
              router.push({ pathname: "/booking-payment-form", params: { bookingId } } as never)
            }>
            <Text style={styles.addButtonText}>＋ Payment</Text>
          </Pressable>
        </View>

        <View style={styles.bookingCard}>
          <Text style={styles.bookingName}>{booking?.customerName || "Booking"}</Text>
          <Text style={styles.propertyText}>{booking?.propertyName || ""}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>{formatAmount(booking?.totalAmount || 0)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Received</Text>
              <Text style={styles.summaryValue}>{formatAmount(booking?.receivedAmount || 0)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Balance</Text>
              <Text style={[styles.summaryValue, styles.balanceText]}>
                {formatAmount(booking?.balanceAmount || 0)}
              </Text>
            </View>
          </View>
          <Text style={styles.paymentTotal}>Payment entries total: {formatAmount(paymentTotal)}</Text>
        </View>

        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await loadData();
                setRefreshing(false);
              }}
            />
          }
          contentContainerStyle={payments.length ? styles.listContent : styles.emptyContent}
          renderItem={({ item }) => (
            <View style={styles.paymentCard}>
              <View style={styles.paymentTopRow}>
                <View>
                  <Text style={styles.amount}>{formatAmount(item.amount)}</Text>
                  <Text style={styles.date}>{item.paymentDate} • {item.mode}</Text>
                </View>
                <Pressable onPress={() => handleDelete(item)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
              {!!item.referenceNumber && (
                <Text style={styles.meta}>Reference: {item.referenceNumber}</Text>
              )}
              {!!item.notes && <Text style={styles.notes}>{item.notes}</Text>}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>No payment entries</Text>
              <Text style={styles.emptyText}>First payment add karne ke liye ऊपर button dabayein.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: SPACING.md },
  headingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md },
  backText: { color: COLORS.primary, fontSize: 17, fontWeight: "700" },
  addButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 11 },
  addButtonText: { color: "#FFFFFF", fontWeight: "800" },
  bookingCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  bookingName: { color: COLORS.text, fontSize: 20, fontWeight: "800" },
  propertyText: { color: COLORS.textMuted, marginTop: 4, marginBottom: 14 },
  summaryRow: { flexDirection: "row", gap: 8 },
  summaryItem: { flex: 1, backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: 10 },
  summaryLabel: { color: COLORS.textMuted, fontSize: 11 },
  summaryValue: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginTop: 4 },
  balanceText: { color: COLORS.danger },
  paymentTotal: { marginTop: 12, color: COLORS.textMuted, fontSize: 12 },
  listContent: { paddingBottom: 30, gap: 10 },
  emptyContent: { flexGrow: 1 },
  paymentCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  paymentTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  amount: { color: COLORS.text, fontSize: 19, fontWeight: "900" },
  date: { color: COLORS.textMuted, marginTop: 5 },
  deleteText: { color: COLORS.danger, fontWeight: "700" },
  meta: { color: COLORS.textMuted, marginTop: 12, fontSize: 12 },
  notes: { color: COLORS.text, marginTop: 7 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
  emptyText: { color: COLORS.textMuted, textAlign: "center", marginTop: 8 },
  primaryButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 20, paddingVertical: 12, marginTop: 16 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800" },
});
