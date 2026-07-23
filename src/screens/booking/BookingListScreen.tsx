import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../../components/AppHeader";
import BottomNavigation, {
  BottomNavigationKey,
} from "../../components/BottomNavigation";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import {
  Booking,
  deleteBooking,
  getBookings,
} from "../../storage/bookingStorage";

function formatAmount(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function BookingListScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = useCallback(async () => {
    setBookings(await getBookings());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBookings();
    }, [loadBookings])
  );

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return bookings;

    return bookings.filter((booking) =>
      [
        booking.customerName,
        booking.customerMobile,
        booking.propertyName,
        booking.propertyLocation,
        booking.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [bookings, search]);

  const totals = useMemo(
    () =>
      filteredBookings.reduce(
        (result, booking) => ({
          total: result.total + booking.totalAmount,
          received: result.received + booking.receivedAmount,
          balance: result.balance + booking.balanceAmount,
        }),
        { total: 0, received: 0, balance: 0 }
      ),
    [filteredBookings]
  );

  const handleNavigation = (key: BottomNavigationKey) => {
    const routes: Partial<Record<BottomNavigationKey, string>> = {
      dashboard: "/dashboard",
      leads: "/leads",
      customers: "/customers",
      followups: "/followups",
    };
    const route = routes[key];
    if (route) router.replace(route as never);
  };

  const handleDelete = (booking: Booking) => {
    Alert.alert("Delete Booking", `${booking.customerName} ki booking delete karni hai?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteBooking(booking.id);
          await loadBookings();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader segment="Booking Management" />

      <View style={styles.container}>
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.title}>Bookings</Text>
            <Text style={styles.subtitle}>{filteredBookings.length} active records</Text>
          </View>
          <Pressable style={styles.addButton} onPress={() => router.push("/booking-form" as never)}>
            <Text style={styles.addButtonText}>＋ Add</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Booking Value</Text>
            <Text style={styles.statValue}>{formatAmount(totals.total)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Received</Text>
            <Text style={[styles.statValue, styles.receivedText]}>{formatAmount(totals.received)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Balance</Text>
            <Text style={[styles.statValue, styles.balanceText]}>{formatAmount(totals.balance)}</Text>
          </View>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search customer, mobile, property or status"
          placeholderTextColor={COLORS.textMuted}
          style={styles.searchInput}
        />

        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={COLORS.primary}
              onRefresh={async () => {
                setRefreshing(true);
                await loadBookings();
                setRefreshing(false);
              }}
            />
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No bookings found.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({ pathname: "/booking-form", params: { id: item.id } } as never)
              }
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardMain}>
                  <Text style={styles.customerName}>{item.customerName}</Text>
                  <Text style={styles.mobile}>{item.customerMobile}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.propertyName}>{item.propertyName}</Text>
              <Text style={styles.location}>{item.propertyLocation || "Location not added"}</Text>

              <View style={styles.amountRow}>
                <View>
                  <Text style={styles.amountLabel}>Total</Text>
                  <Text style={styles.amountValue}>{formatAmount(item.totalAmount)}</Text>
                </View>
                <View>
                  <Text style={styles.amountLabel}>Received</Text>
                  <Text style={[styles.amountValue, styles.receivedText]}>
                    {formatAmount(item.receivedAmount)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.amountLabel}>Balance</Text>
                  <Text style={[styles.amountValue, styles.balanceText]}>
                    {formatAmount(item.balanceAmount)}
                  </Text>
                </View>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.dateText}>📅 {item.bookingDate}</Text>
                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.paymentButton}
                    onPress={(event) => {
                      event.stopPropagation();
                      router.push({
                        pathname: "/booking-payments",
                        params: { bookingId: item.id },
                      } as never);
                    }}>
                    <Text style={styles.paymentButtonText}>Payments</Text>
                  </Pressable>
                  <Pressable
                    style={styles.installmentButton}
                    onPress={(event) => {
                      event.stopPropagation();
                      router.push({
                        pathname: "/booking-installments",
                        params: { bookingId: item.id },
                      } as never);
                    }}>
                    <Text style={styles.installmentButtonText}>Installments</Text>
                  </Pressable>
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      handleDelete(item);
                    }}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          )}
        />
      </View>

      <BottomNavigation activeKey="more" onChange={handleNavigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: SPACING.lg },
  headingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: COLORS.text, fontSize: 24, fontWeight: "900" },
  subtitle: { color: COLORS.textMuted, marginTop: 3 },
  addButton: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 11, borderRadius: RADIUS.md },
  addButtonText: { color: COLORS.white, fontWeight: "900" },
  statsRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md },
  statLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: "700" },
  statValue: { color: COLORS.text, fontSize: 13, fontWeight: "900", marginTop: 6 },
  receivedText: { color: COLORS.success },
  balanceText: { color: COLORS.warning },
  searchInput: { marginTop: SPACING.lg, backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: RADIUS.md, color: COLORS.text, paddingHorizontal: 16, minHeight: 50 },
  listContent: { paddingTop: SPACING.lg, paddingBottom: SPACING.xxl },
  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  cardMain: { flex: 1 },
  customerName: { color: COLORS.text, fontSize: 17, fontWeight: "900" },
  mobile: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  statusBadge: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: 10, paddingVertical: 7, borderRadius: RADIUS.round },
  statusText: { color: COLORS.text, fontSize: 10, fontWeight: "900" },
  propertyName: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginTop: SPACING.lg },
  location: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  amountRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: SPACING.lg, paddingTop: SPACING.md },
  amountLabel: { color: COLORS.textMuted, fontSize: 10 },
  amountValue: { color: COLORS.text, fontSize: 12, fontWeight: "900", marginTop: 4 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: SPACING.lg },
  dateText: { color: COLORS.textMuted, fontSize: 11 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  paymentButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 8 },
  paymentButtonText: { color: COLORS.white, fontWeight: "900", fontSize: 11 },
  deleteText: { color: COLORS.danger, fontSize: 11, fontWeight: "900" },
  emptyText: { color: COLORS.textMuted, textAlign: "center", marginTop: 60 },
});
