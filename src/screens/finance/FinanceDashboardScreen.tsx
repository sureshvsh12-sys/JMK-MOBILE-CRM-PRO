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
import { router, useFocusEffect, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../../components/AppHeader";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import {
  deleteFinanceEntry,
  getFinanceEntries,
  getFinanceSummary,
} from "../../storage/financeStorage";
import type { FinanceEntry, FinanceEntryType } from "../../storage/financeStorage";

const FINANCE_ENTRY_ROUTE: Href = "/finance-entry";

type Filter = "All" | FinanceEntryType;
const FILTERS: Filter[] = ["All", "Income", "Expense"];

function formatAmount(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function FinanceDashboardScreen() {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setEntries(await getFinanceEntries());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter((entry) => {
      const filterMatches = filter === "All" || entry.type === filter;
      const queryMatches =
        !query ||
        [entry.title, entry.partyName, entry.category, entry.paymentMode]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return filterMatches && queryMatches;
    });
  }, [entries, filter, search]);

  const summary = useMemo(() => getFinanceSummary(entries), [entries]);

  const remove = (entry: FinanceEntry) => {
    Alert.alert("Delete Entry", `${entry.title} delete karna hai?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteFinanceEntry(entry.id);
          await load();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader segment="Finance CRM" />

      <View style={styles.container}>
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.title}>Finance</Text>
            <Text style={styles.subtitle}>Income, expense aur cash balance</Text>
          </View>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push(FINANCE_ENTRY_ROUTE)}
          >
            <Text style={styles.addButtonText}>＋ Entry</Text>
          </Pressable>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard label="Income" value={formatAmount(summary.income)} tone="income" />
          <SummaryCard label="Expense" value={formatAmount(summary.expense)} tone="expense" />
          <SummaryCard label="Balance" value={formatAmount(summary.balance)} tone="balance" />
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search title, party, category or payment mode"
          placeholderTextColor={COLORS.textMuted}
          style={styles.searchInput}
        />

        <View style={styles.filters}>
          {FILTERS.map((item) => (
            <Pressable
              key={item}
              style={[styles.filter, filter === item && styles.filterActive]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={filteredEntries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={COLORS.primary}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
            />
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No finance entries found.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({ pathname: "/finance-entry", params: { id: item.id } })
              }
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.typeIcon,
                    item.type === "Income" ? styles.incomeIcon : styles.expenseIcon,
                  ]}
                >
                  <Text style={styles.typeIconText}>{item.type === "Income" ? "↙" : "↗"}</Text>
                </View>
                <View style={styles.cardMain}>
                  <Text style={styles.entryTitle}>{item.title}</Text>
                  <Text style={styles.entryMeta}>
                    {item.partyName || "No party"} • {item.category}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.amount,
                    item.type === "Income" ? styles.incomeText : styles.expenseText,
                  ]}
                >
                  {item.type === "Income" ? "+" : "-"}
                  {formatAmount(item.amount)}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.footerText}>
                  {item.entryDate} • {item.paymentMode}
                </Text>
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    remove(item);
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

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "income" | "expense" | "balance";
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[
          styles.summaryValue,
          tone === "income" && styles.incomeText,
          tone === "expense" && styles.expenseText,
          tone === "balance" && styles.balanceText,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: SPACING.lg },
  headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: COLORS.text, fontSize: 24, fontWeight: "900" },
  subtitle: { color: COLORS.textMuted, marginTop: 3, fontSize: 12 },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
  },
  addButtonText: { color: COLORS.white, fontWeight: "900" },
  summaryGrid: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  summaryLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: "700" },
  summaryValue: { color: COLORS.text, fontSize: 15, fontWeight: "900", marginTop: 7 },
  incomeText: { color: COLORS.success },
  expenseText: { color: COLORS.danger },
  balanceText: { color: COLORS.info },
  searchInput: {
    marginTop: SPACING.lg,
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    color: COLORS.text,
    paddingHorizontal: 15,
  },
  filters: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md },
  filter: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.textMuted, fontWeight: "800", fontSize: 11 },
  filterTextActive: { color: COLORS.white },
  listContent: { paddingTop: SPACING.lg, paddingBottom: SPACING.xxl },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  typeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  incomeIcon: { backgroundColor: "rgba(22, 163, 74, 0.18)" },
  expenseIcon: { backgroundColor: "rgba(220, 38, 38, 0.18)" },
  typeIconText: { color: COLORS.white, fontSize: 20, fontWeight: "900" },
  cardMain: { flex: 1, marginLeft: SPACING.md },
  entryTitle: { color: COLORS.text, fontSize: 15, fontWeight: "900" },
  entryMeta: { color: COLORS.textMuted, marginTop: 4, fontSize: 11 },
  amount: { fontSize: 14, fontWeight: "900", marginLeft: SPACING.sm },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
  },
  footerText: { color: COLORS.textMuted, fontSize: 10 },
  deleteText: { color: COLORS.danger, fontSize: 11, fontWeight: "900" },
  emptyText: { color: COLORS.textMuted, textAlign: "center", marginTop: 60 },
});
