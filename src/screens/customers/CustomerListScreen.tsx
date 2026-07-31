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
import {
  deleteCustomer,
  getCustomers,
  subscribeToCustomers,
} from "../../storage/customerStorage";
import {
  CUSTOMER_SEGMENTS,
  Customer,
  CustomerSegment,
} from "../../types/customer";

export default function CustomerListScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<CustomerSegment | "All">("All");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCustomers = useCallback(async () => {
    try {
      setError("");
      setCustomers(await getCustomers({ limit: 500 }));
    } catch (loadError) {
      console.error("Unable to load customers:", loadError);
      setError("Customers load nahi ho sake. Internet aur Supabase connection check karein.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCustomers();
      const unsubscribe = subscribeToCustomers(() => void loadCustomers());
      return unsubscribe;
    }, [loadCustomers])
  );

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSegment = segment === "All" || customer.segment === segment;
      const matchesSearch =
        !query ||
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
          .includes(query);

      return matchesSegment && matchesSearch;
    });
  }, [customers, search, segment]);

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
      if (!(await Linking.canOpenURL(url))) {
        Alert.alert("Not Available", errorMessage);
        return;
      }
      await Linking.openURL(url);
    } catch (linkError) {
      console.error("Unable to open external URL:", linkError);
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
          try {
            await deleteCustomer(customer.id);
            await loadCustomers();
          } catch (deleteError) {
            console.error("Unable to delete customer:", deleteError);
            Alert.alert("Delete Failed", "Customer delete nahi ho saka.");
          }
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
            <Text style={styles.subtitle}>{filteredCustomers.length} live records</Text>
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

        <View style={styles.filters}>
          {(["All", ...CUSTOMER_SEGMENTS] as const).map((item) => (
            <Pressable
              key={item}
              style={[styles.filter, segment === item && styles.filterActive]}
              onPress={() => setSegment(item)}
            >
              <Text style={[styles.filterText, segment === item && styles.filterTextActive]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        {!!error && (
          <Pressable style={styles.errorBox} onPress={() => void loadCustomers()}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Tap to retry</Text>
          </Pressable>
        )}

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
              title={loading ? "Loading Customers" : "No Customers Found"}
              message={loading ? "Supabase se customer records load ho rahe hain." : "Search clear karein ya pehla customer record add karein."}
              actionLabel={loading ? undefined : "Add Customer"}
              onActionPress={loading ? undefined : () => router.push("/customer-form" as never)}
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
                  void openExternalUrl(`https://wa.me/91${item.mobile}`, "WhatsApp open nahi ho saka.");
                }}>
                  <Text style={styles.actionText}>WhatsApp</Text>
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

      <BottomNavigation activeKey="customers" onNavigate={handleNavigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: SPACING.lg },
  headingRow: { marginTop: SPACING.lg, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: COLORS.text, fontSize: 24, fontWeight: "900" },
  subtitle: { color: COLORS.textMuted, marginTop: 3 },
  addButton: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 11, borderRadius: RADIUS.md },
  addButtonText: { color: COLORS.white, fontWeight: "900" },
  searchWrap: { marginTop: SPACING.lg },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginTop: SPACING.md },
  filter: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, borderRadius: RADIUS.round, paddingHorizontal: 13, paddingVertical: 8 },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.textMuted, fontSize: 11, fontWeight: "800" },
  filterTextActive: { color: COLORS.white },
  errorBox: { marginTop: SPACING.md, borderWidth: 1, borderColor: COLORS.danger, borderRadius: RADIUS.md, padding: SPACING.md },
  errorText: { color: COLORS.danger, fontWeight: "700" },
  retryText: { color: COLORS.textMuted, marginTop: 4, fontSize: 11 },
  listContent: { paddingTop: SPACING.lg, paddingBottom: 110 },
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
