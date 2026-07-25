import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../../components/AppHeader";
import EmptyState from "../../components/common/EmptyState";
import SearchField from "../../components/common/SearchField";
import BottomNavigation, {
  BottomNavigationKey,
} from "../../components/BottomNavigation";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { deleteCustomer, getCustomers } from "../../storage/customerStorage";
import { Customer } from "../../types/customer";

export default function CustomerListScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadCustomers = useCallback(async () => {
    setCustomers(await getCustomers());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCustomers();
    }, [loadCustomers])
  );

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) =>
      [
        customer.name,
        customer.mobile,
        customer.alternateMobile,
        customer.email,
        customer.city,
        customer.segment,
        customer.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [customers, search]);

  const handleNavigation = (key: BottomNavigationKey) => {
    const routes: Partial<Record<BottomNavigationKey, string>> = {
      dashboard: "/dashboard",
      leads: "/leads",
      customers: "/customers",
    };
    const route = routes[key];
    if (route) router.replace(route as never);
  };


  const openExternalUrl = async (url: string, errorMessage: string) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert("Not Available", errorMessage);
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.error("Unable to open external URL:", error);
      Alert.alert("Action Failed", errorMessage);
    }
  };

  const handleDelete = (customer: Customer) => {
    Alert.alert("Delete Customer", `${customer.name} ko delete karna hai?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteCustomer(customer.id);
          await loadCustomers();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader segment="Customer Management" />

      <View style={styles.container}>
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.title}>Customers</Text>
            <Text style={styles.subtitle}>{filteredCustomers.length} records</Text>
          </View>
          <Pressable style={styles.addButton} onPress={() => router.push("/customer-form" as never)}>
            <Text style={styles.addButtonText}>＋ Add</Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, mobile, city or segment"
          />
        </View>

        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={COLORS.primary}
              onRefresh={async () => {
                setRefreshing(true);
                await loadCustomers();
                setRefreshing(false);
              }}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="◉"
              title="No Customers Found"
              message="Search clear karein ya pehla customer record add karein."
              actionLabel="Add Customer"
              onActionPress={() => router.push("/customer-form" as never)}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push({ pathname: "/customer-360", params: { id: item.id } } as never)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.cardMain}>
                  <Text style={styles.customerName}>{item.name}</Text>
                  <Text style={styles.meta}>{item.mobile} • {item.city || "No city"}</Text>
                </View>
                <View style={styles.segmentBadge}>
                  <Text style={styles.segmentText}>{item.segment}</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <Pressable style={styles.actionButton} onPress={(event) => {
                    event.stopPropagation();
                    void openExternalUrl(`tel:${item.mobile}`, "Call app open nahi ho saka.");
                  }}>
                  <Text style={styles.actionText}>📞 Call</Text>
                </Pressable>
                <Pressable style={styles.actionButton} onPress={(event) => {
                    event.stopPropagation();
                    void openExternalUrl(
                      `https://wa.me/91${item.mobile}`,
                      "WhatsApp open nahi ho saka."
                    );
                  }}>
                  <Text style={styles.actionText}>💬 WhatsApp</Text>
                </Pressable>
                <Pressable style={styles.deleteButton} onPress={(event) => {
                    event.stopPropagation();
                    handleDelete(item);
                  }}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </Pressable>
          )}
        />
      </View>

      <BottomNavigation activeKey="customers" onChange={handleNavigation} />
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
  searchWrap: { marginTop: SPACING.lg },
  listContent: { paddingTop: SPACING.lg, paddingBottom: SPACING.xl },
  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  cardMain: { flex: 1, marginLeft: SPACING.md },
  customerName: { color: COLORS.text, fontSize: 16, fontWeight: "900" },
  meta: { color: COLORS.textMuted, marginTop: 4, fontSize: 12 },
  segmentBadge: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.round },
  segmentText: { color: COLORS.text, fontSize: 11, fontWeight: "800" },
  actionRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg },
  actionButton: { flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.sm, paddingVertical: 10, alignItems: "center" },
  actionText: { color: COLORS.text, fontSize: 11, fontWeight: "800" },
  deleteButton: { paddingHorizontal: 12, justifyContent: "center" },
  deleteText: { color: COLORS.danger, fontSize: 11, fontWeight: "900" },
});
