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
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { Booking, getBookingById } from "../../storage/bookingStorage";
import {
  BookingInstallment,
  deleteBookingInstallment,
  getBookingInstallments,
  markInstallmentPaid,
} from "../../storage/bookingInstallmentStorage";

function formatAmount(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function BookingInstallmentListScreen() {
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId = typeof params.bookingId === "string" ? params.bookingId : "";
  const [booking, setBooking] = useState<Booking | null>(null);
  const [items, setItems] = useState<BookingInstallment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!bookingId) return;
    const [bookingRecord, installments] = await Promise.all([
      getBookingById(bookingId),
      getBookingInstallments(bookingId),
    ]);
    setBooking(bookingRecord);
    setItems(installments);
  }, [bookingId]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const summary = useMemo(
    () =>
      items.reduce(
        (result, item) => ({
          total: result.total + item.amount,
          paid: result.paid + (item.status === "Paid" ? item.amount : 0),
          pending: result.pending + (item.status !== "Paid" ? item.amount : 0),
        }),
        { total: 0, paid: 0, pending: 0 }
      ),
    [items]
  );

  const deleteItem = (item: BookingInstallment) => {
    Alert.alert("Delete Installment", `${item.title} delete karna hai?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteBookingInstallment(item.id);
          await loadData();
        },
      },
    ]);
  };

  const payItem = (item: BookingInstallment) => {
    Alert.alert("Mark Paid", `${item.title} ko paid mark karna hai?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark Paid",
        onPress: async () => {
          await markInstallmentPaid(item.id);
          await loadData();
        },
      },
    ]);
  };

  if (!bookingId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <AppHeader segment="Booking Installments" />
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
      <AppHeader segment="Booking Installments" />
      <View style={styles.container}>
        <View style={styles.headingRow}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
          <Pressable
            style={styles.addButton}
            onPress={() =>
              router.push({ pathname: "/booking-installment-form", params: { bookingId } } as never)
            }
          >
            <Text style={styles.addButtonText}>＋ Installment</Text>
          </Pressable>
        </View>

        <View style={styles.bookingCard}>
          <Text style={styles.bookingName}>{booking?.customerName || "Booking"}</Text>
          <Text style={styles.propertyText}>{booking?.propertyName || ""}</Text>
          <Text style={styles.balanceText}>
            Current Balance: {formatAmount(booking?.balanceAmount || 0)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Scheduled</Text>
            <Text style={styles.summaryValue}>{formatAmount(summary.total)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={[styles.summaryValue, styles.paidText]}>{formatAmount(summary.paid)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={[styles.summaryValue, styles.pendingText]}>{formatAmount(summary.pending)}</Text>
          </View>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={items.length ? styles.listContent : styles.emptyContent}
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
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>No installments</Text>
              <Text style={styles.emptyText}>Installment schedule add karne ke liye ऊपर button dabayein.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/booking-installment-form",
                  params: { bookingId, id: item.id },
                } as never)
              }
            >
              <View style={styles.cardTopRow}>
                <View style={styles.cardMain}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.dueDate}>Due: {item.dueDate}</Text>
                </View>
                <View style={[styles.statusBadge, item.status === "Paid" && styles.statusPaid, item.status === "Overdue" && styles.statusOverdue]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.amount}>{formatAmount(item.amount)}</Text>
              {!!item.paidDate && <Text style={styles.meta}>Paid on: {item.paidDate}</Text>}
              {!!item.notes && <Text style={styles.notes}>{item.notes}</Text>}

              <View style={styles.actions}>
                {item.status !== "Paid" && (
                  <Pressable
                    style={styles.payButton}
                    onPress={(event) => {
                      event.stopPropagation();
                      payItem(item);
                    }}
                  >
                    <Text style={styles.payButtonText}>Mark Paid</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    deleteItem(item);
                  }}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </Pressable>
          )}
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
  addButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 15, paddingVertical: 11 },
  addButtonText: { color: "#FFFFFF", fontWeight: "900" },
  bookingCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  bookingName: { color: COLORS.text, fontSize: 20, fontWeight: "900" },
  propertyText: { color: COLORS.textMuted, marginTop: 4 },
  balanceText: { color: COLORS.danger, fontWeight: "800", marginTop: 10 },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: SPACING.md },
  summaryCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 10, borderWidth: 1, borderColor: COLORS.border },
  summaryLabel: { color: COLORS.textMuted, fontSize: 11 },
  summaryValue: { color: COLORS.text, fontWeight: "900", marginTop: 5, fontSize: 13 },
  paidText: { color: "#16A34A" },
  pendingText: { color: COLORS.danger },
  listContent: { gap: 10, paddingBottom: 30 },
  emptyContent: { flexGrow: 1 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  cardMain: { flex: 1 },
  title: { color: COLORS.text, fontSize: 17, fontWeight: "900" },
  dueDate: { color: COLORS.textMuted, marginTop: 4 },
  statusBadge: { backgroundColor: "#FEF3C7", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusPaid: { backgroundColor: "#DCFCE7" },
  statusOverdue: { backgroundColor: "#FEE2E2" },
  statusText: { color: COLORS.text, fontSize: 11, fontWeight: "800" },
  amount: { color: COLORS.text, fontSize: 21, fontWeight: "900", marginTop: 14 },
  meta: { color: COLORS.textMuted, marginTop: 7, fontSize: 12 },
  notes: { color: COLORS.text, marginTop: 8 },
  actions: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 18, marginTop: 16 },
  payButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 8 },
  payButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
  deleteText: { color: COLORS.danger, fontWeight: "800" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  emptyText: { color: COLORS.textMuted, textAlign: "center", marginTop: 8 },
  primaryButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 20, paddingVertical: 12, marginTop: 16 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "900" },
});
