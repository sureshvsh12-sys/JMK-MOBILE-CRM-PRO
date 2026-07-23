import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  router,
} from "expo-router";

import type {
  Href,
} from "expo-router";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import AppHeader from "../../components/AppHeader";

import {
  COLORS,
  RADIUS,
  SPACING,
} from "../../constants/theme";

import {
  searchGlobalData,
} from "../../storage/globalSearchStorage";

import type {
  GlobalSearchResult,
  SearchModule,
} from "../../storage/globalSearchStorage";

type SearchFilter = "All" | SearchModule;

const FILTERS: SearchFilter[] = [
  "All",
  "Customers",
  "Leads",
  "Bookings",
  "Follow-ups",
];

export default function GlobalSearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    GlobalSearchResult[]
  >([]);
  const [filter, setFilter] =
    useState<SearchFilter>("All");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] =
    useState(false);

  const runSearch = useCallback(
    async (value?: string) => {
      const searchValue = (
        value ?? query
      ).trim();

      if (searchValue.length < 2) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);

      try {
        const searchResults =
          await searchGlobalData(searchValue);

        setResults(searchResults);
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  const visibleResults = useMemo(() => {
    if (filter === "All") {
      return results;
    }

    return results.filter(
      (result) => result.module === filter
    );
  }, [filter, results]);

  const moduleCounts = useMemo(() => {
    return {
      All: results.length,
      Customers: results.filter(
        (item) => item.module === "Customers"
      ).length,
      Leads: results.filter(
        (item) => item.module === "Leads"
      ).length,
      Bookings: results.filter(
        (item) => item.module === "Bookings"
      ).length,
      "Follow-ups": results.filter(
        (item) => item.module === "Follow-ups"
      ).length,
    };
  }, [results]);

  const handleChangeText = (value: string) => {
    setQuery(value);

    if (!value.trim()) {
      setResults([]);
      setHasSearched(false);
      setFilter("All");
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setFilter("All");
    setHasSearched(false);
  };

  const handleOpenResult = (
    result: GlobalSearchResult
  ) => {
    const destination = {
      pathname: result.route,
      params: result.routeParams,
    } as Href;

    router.push(destination);
  };

  const handleCall = async (mobile?: string) => {
    const cleanMobile = mobile?.replace(/\D/g, "");

    if (!cleanMobile) return;

    const url = `tel:${cleanMobile}`;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    }
  };

  const handleWhatsApp = async (
    mobile?: string
  ) => {
    const cleanMobile = mobile?.replace(/\D/g, "").slice(-10);

    if (!cleanMobile) return;

    const message = encodeURIComponent(
      "Namaste, JMK Group se sampark kar rahe hain."
    );

    const url = `https://wa.me/91${cleanMobile}?text=${message}`;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <AppHeader segment="Global Search" />

      <View style={styles.container}>
        <Text style={styles.title}>
          Search Everything
        </Text>

        <Text style={styles.subtitle}>
          Customers, leads, bookings aur
          follow-ups ek jagah search karein.
        </Text>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>

          <TextInput
            value={query}
            onChangeText={handleChangeText}
            onSubmitEditing={() =>
              void runSearch()
            }
            placeholder="Naam, mobile, property, status..."
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="search"
            autoCorrect={false}
            style={styles.input}
          />

          {query ? (
            <Pressable
              style={styles.clearButton}
              onPress={handleClear}
            >
              <Text style={styles.clearText}>
                ✕
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.searchButton,
              pressed && styles.pressed,
            ]}
            onPress={() => void runSearch()}
          >
            <Text style={styles.searchButtonText}>
              Search
            </Text>
          </Pressable>
        </View>

        {results.length > 0 ? (
          <View style={styles.filters}>
            {FILTERS.map((item) => {
              const active = filter === item;

              return (
                <Pressable
                  key={item}
                  style={[
                    styles.filterButton,
                    active &&
                      styles.filterButtonActive,
                  ]}
                  onPress={() => setFilter(item)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      active &&
                        styles.filterTextActive,
                    ]}
                  >
                    {item} ({moduleCounts[item]})
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
            />

            <Text style={styles.loadingText}>
              Searching JMK CRM...
            </Text>
          </View>
        ) : (
          <FlatList
            data={visibleResults}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              visibleResults.length
                ? styles.list
                : styles.emptyList
            }
            ListHeaderComponent={
              visibleResults.length ? (
                <Text style={styles.resultCount}>
                  {visibleResults.length} result
                  {visibleResults.length === 1
                    ? ""
                    : "s"}{" "}
                  found
                </Text>
              ) : null
            }
            ListEmptyComponent={
              <EmptySearchState
                hasSearched={hasSearched}
                query={query}
              />
            }
            renderItem={({ item }) => (
              <SearchResultCard
                result={item}
                onOpen={() =>
                  handleOpenResult(item)
                }
                onCall={() =>
                  void handleCall(item.mobile)
                }
                onWhatsApp={() =>
                  void handleWhatsApp(
                    item.mobile
                  )
                }
              />
            )}
          />
        )}
      </View>
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
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
      onPress={onOpen}
    >
      <View style={styles.cardTop}>
        <View style={styles.moduleIconContainer}>
          <Text style={styles.moduleIcon}>
            {getModuleIcon(result.module)}
          </Text>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text
              style={styles.cardTitle}
              numberOfLines={1}
            >
              {result.title}
            </Text>

            <View style={styles.moduleBadge}>
              <Text style={styles.moduleBadgeText}>
                {result.module}
              </Text>
            </View>
          </View>

          <Text
            style={styles.cardSubtitle}
            numberOfLines={1}
          >
            {result.subtitle}
          </Text>

          <Text
            style={styles.cardDetail}
            numberOfLines={2}
          >
            {result.detail}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {result.mobile ? (
          <>
            <Pressable
              style={styles.actionButton}
              onPress={(event) => {
                event.stopPropagation();
                onCall();
              }}
            >
              <Text style={styles.callText}>
                📞 Call
              </Text>
            </Pressable>

            <Pressable
              style={styles.actionButton}
              onPress={(event) => {
                event.stopPropagation();
                onWhatsApp();
              }}
            >
              <Text style={styles.whatsAppText}>
                WhatsApp
              </Text>
            </Pressable>
          </>
        ) : null}

        <Pressable
          style={styles.openButton}
          onPress={(event) => {
            event.stopPropagation();
            onOpen();
          }}
        >
          <Text style={styles.openText}>
            Open →
          </Text>
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
  if (!hasSearched) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔎</Text>

        <Text style={styles.emptyTitle}>
          Global Search
        </Text>

        <Text style={styles.emptyText}>
          Kam se kam 2 letters ya mobile number
          enter karke Search dabayein.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>

      <Text style={styles.emptyTitle}>
        No result found
      </Text>

      <Text style={styles.emptyText}>
        “{query}” se related koi customer,
        lead, booking ya follow-up nahi mila.
      </Text>
    </View>
  );
}

function getModuleIcon(
  module: SearchModule
): string {
  const icons: Record<SearchModule, string> = {
    Customers: "👥",
    Leads: "🎯",
    Bookings: "🏠",
    "Follow-ups": "📅",
  };

  return icons[module];
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },

  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
  },

  subtitle: {
    color: COLORS.textMuted,
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    paddingLeft: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  searchIcon: {
    color: COLORS.textMuted,
    fontSize: 22,
  },

  input: {
    flex: 1,
    minHeight: 54,
    color: COLORS.text,
    fontSize: 14,
  },

  clearButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceLight,
  },

  clearText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "900",
  },

  searchButton: {
    minHeight: 54,
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    borderTopRightRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
  },

  searchButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  filterText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "800",
  },

  filterTextActive: {
    color: COLORS.white,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: COLORS.textMuted,
    marginTop: SPACING.md,
    fontSize: 12,
  },

  list: {
    paddingTop: SPACING.lg,
    paddingBottom: 40,
  },

  emptyList: {
    flexGrow: 1,
  },

  resultCount: {
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    fontSize: 11,
    fontWeight: "700",
  },

  card: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.surfaceLight,
  },

  moduleIcon: {
    fontSize: 21,
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
    backgroundColor: COLORS.primaryDark,
  },

  moduleBadgeText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: "900",
  },

  cardSubtitle: {
    color: COLORS.textMuted,
    marginTop: 5,
    fontSize: 11,
    fontWeight: "700",
  },

  cardDetail: {
    color: COLORS.textMuted,
    marginTop: 6,
    fontSize: 11,
    lineHeight: 17,
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
    paddingHorizontal: 11,
    paddingVertical: 8,
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
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
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

  emptyIcon: {
    fontSize: 46,
  },

  emptyTitle: {
    color: COLORS.text,
    marginTop: SPACING.md,
    fontSize: 18,
    fontWeight: "900",
  },

  emptyText: {
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 19,
  },

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },
});
