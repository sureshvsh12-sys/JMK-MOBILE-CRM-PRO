import { useCallback, useMemo, useState } from "react";
import {
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
import BackButton from "../../components/BackButton";
import BottomNavigation from "../../components/BottomNavigation";
import PropertyCard from "../../components/properties/PropertyCard";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import { getProperties } from "../../services/propertiesService";
import type { Property } from "../../types/property";

const TYPES = ["All", "Residential", "Commercial", "Plot", "Agricultural"] as const;
type PropertyTypeFilter = (typeof TYPES)[number];

export default function PropertyListScreen() {
  const [items, setItems] = useState<Property[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<PropertyTypeFilter>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setItems(await getProperties());
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Properties load failed",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((property) => {
      const matchesType = type === "All" || property.type === type;
      const searchable = [
        property.title,
        property.location,
        property.locality,
        property.city,
        property.type,
        property.category,
        property.status,
        property.facing,
      ]
        .join(" ")
        .toLowerCase();

      return matchesType &&
        (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [items, query, type]);

  const availableCount = items.filter(
    (property) => property.status === "Available",
  ).length;
  const featuredCount = items.filter((property) => property.featured).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <AppHeader segment="JMK Assets • Properties" />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={COLORS.assets}
            colors={[COLORS.assets]}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.topRow}>
              <BackButton label="Home" fallbackRoute="/dashboard" />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open property bookings"
                onPress={() => router.push("/bookings")}
                style={({ pressed }) => [
                  styles.bookingsButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.bookingsIcon}>▣</Text>
                <Text style={styles.bookingsText}>Bookings</Text>
              </Pressable>
            </View>

            <Text style={styles.eyebrow}>JMK ASSETS</Text>
            <Text style={styles.title}>Properties</Text>
            <Text style={styles.subtitle}>
              CRM aur website se synced live property inventory. Property open
              karke photos, location, amenities aur complete details dekhein.
            </Text>

            <View style={styles.summary}>
              <SummaryItem label="Published" value={items.length} />
              <SummaryItem label="Available" value={availableCount} />
              <SummaryItem label="Featured" value={featuredCount} />
            </View>

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search title, city, locality, type..."
              placeholderTextColor={COLORS.textMuted}
              autoCorrect={false}
              style={styles.search}
            />

            <FlatList
              horizontal
              data={TYPES}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              renderItem={({ item }) => {
                const active = type === item;

                return (
                  <Pressable
                    onPress={() => setType(item)}
                    style={({ pressed }) => [
                      styles.chip,
                      active && styles.chipActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              }}
            />

            {error ? (
              <Pressable style={styles.error} onPress={load}>
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.retry}>Tap to retry</Text>
              </Pressable>
            ) : null}

            <View style={styles.resultRow}>
              <Text style={styles.result}>{filtered.length} properties found</Text>
              <Pressable onPress={() => router.push("/bookings")}> 
                <Text style={styles.bookingLink}>View Bookings →</Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={() =>
              router.push({
                pathname: "/property-details",
                params: { id: item.id },
              })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>⌂</Text>
              <Text style={styles.emptyTitle}>No matching property</Text>
              <Text style={styles.emptyText}>
                Search ya filter badalkar dekhein. CRM me published properties
                yahan automatically sync hongi.
              </Text>
              <Pressable
                onPress={() => {
                  setQuery("");
                  setType("All");
                }}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </Pressable>
            </View>
          ) : null
        }
      />

      <BottomNavigation activeKey="more" />
    </SafeAreaView>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  bookingsButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.assets,
    ...SHADOW,
  },
  bookingsIcon: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },
  bookingsText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },
  eyebrow: {
    color: COLORS.assets,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  title: {
    marginTop: 5,
    fontSize: 30,
    fontWeight: "900",
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 6,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  summary: {
    marginTop: SPACING.lg,
    flexDirection: "row",
    padding: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.assets,
  },
  summaryLabel: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "800",
  },
  search: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    padding: 14,
    color: COLORS.text,
  },
  chips: {
    gap: 8,
    paddingVertical: 14,
  },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipActive: {
    borderColor: COLORS.assets,
    backgroundColor: COLORS.assets,
  },
  chipText: {
    color: COLORS.textSoft,
    fontWeight: "800",
  },
  chipTextActive: {
    color: COLORS.white,
  },
  error: {
    marginBottom: 16,
    padding: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.danger,
    backgroundColor: "#FEE2E2",
  },
  errorText: {
    color: COLORS.danger,
    fontWeight: "700",
  },
  retry: {
    marginTop: 8,
    color: COLORS.info,
    fontWeight: "900",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  result: {
    color: COLORS.textMuted,
    fontWeight: "800",
  },
  bookingLink: {
    color: COLORS.assets,
    fontSize: 12,
    fontWeight: "900",
  },
  separator: {
    height: SPACING.md,
  },
  empty: {
    marginTop: 24,
    padding: 30,
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIcon: {
    fontSize: 48,
    color: COLORS.assets,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
  },
  emptyText: {
    marginTop: 8,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },
  clearButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.assets,
  },
  clearButtonText: {
    color: COLORS.white,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
