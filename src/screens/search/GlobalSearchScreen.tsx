import { router, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../../components/AppHeader";
import BackButton from "../../components/BackButton";
import BottomNavigation from "../../components/BottomNavigation";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import {
  searchGlobalData,
  type GlobalSearchResult,
  type SearchModule,
} from "../../storage/globalSearchStorage";

type SearchFilter = "All" | SearchModule;

const FILTERS: readonly SearchFilter[] = [
  "All",
  "Customers",
  "Leads",
  "Bookings",
  "Follow-ups",
];

const MODULE_COLORS: Record<SearchModule, string> = {
  Customers: "#7C3AED",
  Leads: "#2563EB",
  Bookings: "#D4A72C",
  "Follow-ups": "#F59E0B",
};

const MODULE_ICONS: Record<SearchModule, string> = {
  Customers: "♟",
  Leads: "◎",
  Bookings: "⌂",
  "Follow-ups": "◷",
};

function normalizeMobile(value?: string): string {
  return String(value || "").replace(/\D/g, "");
}

export default function GlobalSearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [filter, setFilter] = useState<SearchFilter>("All");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  const runSearch = useCallback(async (value: string) => {
    const searchValue = value.trim();

    if (searchValue.length < 2) {
      setResults([]);
      setHasSearched(false);
      setError("");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setError("");

    try {
      const searchResults = await searchGlobalData(searchValue);
      setResults(searchResults);
    } catch (reason) {
      setResults([]);
      setError(
        reason instanceof Error
          ? reason.message
          : "Global search complete nahi ho saki.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setResults([]);
      setHasSearched(false);
      setFilter("All");
      setError("");
      return undefined;
    }

    if (cleanQuery.length < 2) {
      setResults([]);
      setHasSearched(false);
      setError("");
      return undefined;
    }

    const timer = setTimeout(() => {
      void runSearch(cleanQuery);
    }, 450);

    return () => clearTimeout(timer);
  }, [query, runSearch]);

  const visibleResults = useMemo(() => {
    if (filter === "All") return results;
    return results.filter((result) => result.module === filter);
  }, [filter, results]);

  const moduleCounts = useMemo<Record<SearchFilter, number>>(
    () => ({
      All: results.length,
      Customers: results.filter((item) => item.module === "Customers").length,
      Leads: results.filter((item) => item.module === "Leads").length,
      Bookings: results.filter((item) => item.module === "Bookings").length,
      "Follow-ups": results.filter((item) => item.module === "Follow-ups").length,
    }),
    [results],
  );

  function clearSearch() {
    setQuery("");
    setResults([]);
    setFilter("All");
    setHasSearched(false);
    setError("");
  }

  function openResult(result: GlobalSearchResult) {
    const destination = {
      pathname: result.route,
      params: result.routeParams,
    } as Href;

    router.push(destination);
  }

  async function openCall(mobile?: string) {
    const cleanMobile = normalizeMobile(mobile);

    if (!cleanMobile) {
      Alert.alert("Mobile Missing", "Is record me mobile number available nahi hai.");
      return;
    }

    const url = `tel:${cleanMobile}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert("Calling Not Available", "Is device par calling action available nahi hai.");
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert("Unable to Call", "Please try again.");
    }
  }

  async function openWhatsApp(result: GlobalSearchResult) {
    const cleanMobile = normalizeMobile(result.mobile).slice(-10);

    if (cleanMobile.length !== 10) {
      Alert.alert("Invalid Mobile", "Valid 10-digit mobile number available nahi hai.");
      return;
    }

    const message = encodeURIComponent(
      `Namaste ${result.title}, JMK Group se sampark kar rahe hain.`,
    );
    const url = `https://wa.me/91${cleanMobile}?text=${message}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert("WhatsApp Not Available", "WhatsApp is device par available nahi hai.");
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert("Unable to Open WhatsApp", "Please try again.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader segment="Global Search" />

      <View style={styles.container}>
        <View style={styles.topRow}>
          <BackButton />
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>CRM INDEX</Text>
          </View>
        </View>

        <Text style={styles.eyebrow}>ENTERPRISE SEARCH</Text>
        <Text style={styles.title}>Search Everything</Text>
        <Text style={styles.subtitle}>
          Customers, leads, bookings aur follow-ups ko naam, mobile, property,
          location ya status se search karein.
        </Text>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>

          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => void runSearch(query)}
            placeholder="Naam, mobile, property, location..."
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            style={styles.input}
          />

          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              style={styles.clearButton}
              onPress={clearSearch}
            >
              <Text style={styles.clearText}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.searchHint}>
          Search automatically starts after 2 characters.
        </Text>

        {results.length > 0 ? (
          <View style={styles.filters}>
            {FILTERS.map((item) => {
              const active = filter === item;
              const color =
                item === "All" ? COLORS.primary : MODULE_COLORS[item];

              return (
                <Pressable
                  key={item}
                  onPress={() => setFilter(item)}
                  style={[
                    styles.filterButton,
                    {
                      borderColor: color,
                      backgroundColor: active ? color : `${color}14`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: active ? COLORS.white : color },
                    ]}
                  >
                    {item} ({moduleCounts[item]})
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {error ? (
          <Pressable
            onPress={() => void runSearch(query)}
            style={styles.errorBox}
          >
            <Text style={styles.errorText}>{error} Tap to retry.</Text>
          </Pressable>
        ) : null}

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Searching JMK CRM...</Text>
          </View>
        ) : (
          <FlatList
            data={visibleResults}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={
              visibleResults.length ? styles.list : styles.emptyList
            }
            ListHeaderComponent={
              visibleResults.length ? (
                <View style={styles.resultHeader}>
                  <Text style={styles.resultCount}>
                    {visibleResults.length} result
                    {visibleResults.length === 1 ? "" : "s"} found
                  </Text>
                  <Text style={styles.resultModule}>{filter}</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <EmptySearchState hasSearched={hasSearched} query={query} />
            }
            renderItem={({ item }) => (
              <SearchResultCard
                result={item}
                onOpen={() => openResult(item)}
                onCall={() => void openCall(item.mobile)}
                onWhatsApp={() => void openWhatsApp(item)}
              />
            )}
          />
        )}
      </View>

      <BottomNavigation activeKey="more" />
    </SafeAreaView>
  );
}

type SearchResultCardProps = {
  result: GlobalSearchResult;
  onOpen: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
};

function SearchResultCard({
  result,
  onOpen,
  onCall,
  onWhatsApp,
}: SearchResultCardProps) {
  const accent = MODULE_COLORS[result.module];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${result.title}`}
      onPress={onOpen}
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: accent },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.cardTop}>
        <View
          style={[
            styles.moduleIconContainer,
            {
              backgroundColor: `${accent}18`,
              borderColor: `${accent}45`,
            },
          ]}
        >
          <Text style={[styles.moduleIcon, { color: accent }]}>
            {MODULE_ICONS[result.module]}
          </Text>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {result.title}
            </Text>

            <View style={[styles.moduleBadge, { backgroundColor: accent }]}>
              <Text style={styles.moduleBadgeText}>{result.module}</Text>
            </View>
          </View>

          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {result.subtitle}
          </Text>

          <Text style={styles.cardDetail} numberOfLines={2}>
            {result.detail}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {result.mobile ? (
          <>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onCall();
              }}
              style={styles.actionButton}
            >
              <Text style={styles.callText}>Call</Text>
            </Pressable>

            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onWhatsApp();
              }}
              style={styles.actionButton}
            >
              <Text style={styles.whatsAppText}>WhatsApp</Text>
            </Pressable>
          </>
        ) : null}

        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          style={[styles.openButton, { backgroundColor: accent }]}
        >
          <Text style={styles.openText}>Open →</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function EmptySearchState({
  hasSearched,
  query,
}: {
  hasSearched: boolean;
  query: string;
}) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Text style={styles.emptyIcon}>{hasSearched ? "∅" : "⌕"}</Text>
      </View>

      <Text style={styles.emptyTitle}>
        {hasSearched ? "No result found" : "Global Search"}
      </Text>

      <Text style={styles.emptyText}>
        {hasSearched
          ? `“${query}” se related koi CRM record nahi mila. Spelling ya mobile number check karein.`
          : "Kam se kam 2 letters ya mobile digits enter karein. Search automatically start ho jayegi."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADIUS.round,
    backgroundColor: "#16A34A14",
    borderWidth: 1,
    borderColor: "#16A34A45",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: COLORS.success,
  },
  liveText: {
    color: COLORS.success,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  title: {
    marginTop: 5,
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 6,
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 18,
  },
  searchContainer: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  searchIcon: {
    color: COLORS.primary,
    fontSize: 23,
    fontWeight: "900",
  },
  input: {
    flex: 1,
    minHeight: 56,
    marginLeft: SPACING.sm,
    color: COLORS.text,
    fontSize: 14,
  },
  clearButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceLight,
  },
  clearText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "900",
  },
  searchHint: {
    marginTop: 7,
    color: COLORS.textMuted,
    fontSize: 9,
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  filterButton: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: RADIUS.round,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 9,
    fontWeight: "900",
  },
  errorBox: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.danger,
    backgroundColor: "#DC262614",
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: "800",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  list: {
    paddingTop: SPACING.lg,
    paddingBottom: 120,
  },
  emptyList: {
    flexGrow: 1,
    paddingBottom: 110,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  resultCount: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  resultModule: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
  },
  card: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  moduleIconContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  moduleIcon: {
    fontSize: 22,
    fontWeight: "900",
  },
  cardContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  cardTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },
  moduleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
  },
  moduleBadgeText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: "900",
  },
  cardSubtitle: {
    marginTop: 5,
    color: COLORS.textSoft,
    fontSize: 11,
    fontWeight: "800",
  },
  cardDetail: {
    marginTop: 6,
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 16,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
  },
  callText: {
    color: COLORS.info,
    fontSize: 10,
    fontWeight: "900",
  },
  whatsAppText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: "900",
  },
  openButton: {
    marginLeft: "auto",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
  },
  openText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyIconCircle: {
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 39,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  emptyIcon: {
    color: COLORS.primary,
    fontSize: 34,
    fontWeight: "900",
  },
  emptyTitle: {
    marginTop: SPACING.lg,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },
  emptyText: {
    marginTop: SPACING.sm,
    color: COLORS.textMuted,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
});
