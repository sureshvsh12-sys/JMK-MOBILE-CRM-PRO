import { router } from "expo-router";
import { useMemo } from "react";
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

import AppButton from "../../components/AppButton";
import AppHeader from "../../components/AppHeader";
import BackButton from "../../components/BackButton";
import BottomNavigation from "../../components/BottomNavigation";
import EmptyState from "../../components/common/EmptyState";
import SearchField from "../../components/common/SearchField";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import { useFollowups } from "../../hooks/useFollowups";
import type {
  FollowUp,
  FollowUpStatus,
} from "../../services/followupsService";

type FollowUpFilter = "All" | FollowUpStatus;

const FILTERS: readonly FollowUpFilter[] = [
  "All",
  "Pending",
  "Completed",
  "Cancelled",
];

const FILTER_COLORS: Record<FollowUpFilter, string> = {
  All: "#475569",
  Pending: "#2563EB",
  Completed: "#16A34A",
  Cancelled: "#DC2626",
};

function dayKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatDue(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isOverdue(item: FollowUp, todayKey: string): boolean {
  if (item.status !== "Pending") return false;

  const dueTime = new Date(item.dueAt).getTime();

  return (
    Number.isFinite(dueTime) &&
    dueTime < Date.now() &&
    dayKey(item.dueAt) !== todayKey
  );
}

export default function FollowUpListScreen() {
  const {
    items,
    filtered,
    search,
    setSearch,
    filter,
    setFilter,
    isRefreshing,
    refresh,
    updateStatus,
    remove,
    error,
  } = useFollowups();

  const todayKey = dayKey(new Date());

  const stats = useMemo(() => {
    const pending = items.filter((item) => item.status === "Pending").length;
    const today = items.filter(
      (item) =>
        item.status === "Pending" && dayKey(item.dueAt) === todayKey,
    ).length;
    const overdue = items.filter((item) => isOverdue(item, todayKey)).length;

    return { pending, today, overdue };
  }, [items, todayKey]);

  async function openMode(item: FollowUp) {
    const cleanMobile = String(item.mobile || "").replace(/\D/g, "");

    if (!cleanMobile) {
      Alert.alert("Mobile Missing", "Is follow-up me mobile number available nahi hai.");
      return;
    }

    const normalizedMobile =
      cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;

    const url =
      item.mode === "WhatsApp"
        ? `https://wa.me/${normalizedMobile}`
        : `tel:${cleanMobile}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          "Action Not Available",
          item.mode === "WhatsApp"
            ? "WhatsApp is device par available nahi hai."
            : "Calling action available nahi hai.",
        );
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert("Unable to Open", "Please try again.");
    }
  }

  function confirmDelete(item: FollowUp) {
    Alert.alert(
      "Delete Follow-up",
      `${item.customerName} ka follow-up delete karna hai?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void remove(item.id),
        },
      ],
    );
  }

  return (
    <View style={styles.page}>
      <AppHeader segment="Follow-ups" />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={COLORS.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View>
            <View style={styles.topRow}>
              <BackButton />
              <AppButton
                compact
                label="＋ New Follow-up"
                onPress={() => router.push("/followup-form")}
              />
            </View>

            <Text style={styles.eyebrow}>SALES ACTIVITY</Text>
            <Text style={styles.title}>Follow-ups</Text>
            <Text style={styles.subtitle}>
              Calls, WhatsApp, meetings aur site visits ko ek jagah track karein.
            </Text>

            <View style={styles.stats}>
              <StatCard label="Pending" value={stats.pending} color="#2563EB" />
              <StatCard label="Due Today" value={stats.today} color="#F59E0B" />
              <StatCard label="Overdue" value={stats.overdue} color="#DC2626" />
            </View>

            <SearchField
              value={search}
              onChangeText={setSearch}
              placeholder="Search name, mobile, subject or mode"
            />

            <View style={styles.filters}>
              {FILTERS.map((item) => {
                const active = filter === item;
                const color = FILTER_COLORS[item];

                return (
                  <Pressable
                    key={item}
                    onPress={() => setFilter(item)}
                    style={[
                      styles.filter,
                      {
                        backgroundColor: active ? color : `${color}16`,
                        borderColor: color,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        { color: active ? COLORS.white : color },
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {error ? (
              <Pressable style={styles.errorBox} onPress={refresh}>
                <Text style={styles.error}>
                  {error} Tap to retry.
                </Text>
              </Pressable>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="◷"
            title="No Follow-ups"
            message={
              search
                ? "Search ke hisaab se koi follow-up nahi mila."
                : "Selected filter me koi follow-up nahi mila."
            }
            actionLabel="Add Follow-up"
            onActionPress={() => router.push("/followup-form")}
          />
        }
        renderItem={({ item }) => (
          <FollowUpCard
            item={item}
            overdue={isOverdue(item, todayKey)}
            onOpen={() =>
              router.push({
                pathname: "/followup-form",
                params: { id: item.id },
              })
            }
            onMode={() => void openMode(item)}
            onComplete={() => void updateStatus(item.id, "Completed")}
            onDelete={() => confirmDelete(item)}
          />
        )}
      />

      <BottomNavigation activeKey="followups" />
    </View>
  );
}

type StatCardProps = {
  label: string;
  value: number;
  color: string;
};

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={[styles.statBar, { backgroundColor: color }]} />
    </View>
  );
}

type FollowUpCardProps = {
  item: FollowUp;
  overdue: boolean;
  onOpen: () => void;
  onMode: () => void;
  onComplete: () => void;
  onDelete: () => void;
};

function FollowUpCard({
  item,
  overdue,
  onOpen,
  onMode,
  onComplete,
  onDelete,
}: FollowUpCardProps) {
  const tone =
    item.status === "Completed"
      ? "green"
      : item.status === "Cancelled" || overdue
        ? "red"
        : "blue";

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.customerName || "F").charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.main}>
          <Text style={styles.name}>{item.customerName}</Text>
          <Text style={styles.subject}>{item.subject || item.mode}</Text>
        </View>

        <StatusBadge label={item.status} tone={tone} />
      </View>

      <View style={styles.dueBox}>
        <Text style={styles.dueIcon}>◷</Text>

        <View style={styles.dueContent}>
          <Text style={[styles.due, overdue && styles.overdue]}>
            {formatDue(item.dueAt)}
          </Text>
          <Text style={styles.meta}>
            {item.mode} • {item.priority} priority
          </Text>
        </View>
      </View>

      {item.notes ? (
        <Text numberOfLines={2} style={styles.notes}>
          {item.notes}
        </Text>
      ) : null}

      <View style={styles.actions}>
        {item.status === "Pending" &&
        (item.mode === "WhatsApp" || item.mode === "Call") ? (
          <AppButton
            compact
            label={item.mode}
            variant={item.mode === "WhatsApp" ? "whatsapp" : "call"}
            onPress={onMode}
          />
        ) : null}

        {item.status !== "Completed" ? (
          <AppButton
            compact
            label="Complete"
            variant="success"
            onPress={onComplete}
          />
        ) : null}

        <AppButton
          compact
          label="Delete"
          variant="danger"
          onPress={onDelete}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },
  separator: {
    height: SPACING.md,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
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
    marginTop: 5,
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 17,
  },
  stats: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginVertical: SPACING.lg,
  },
  statCard: {
    position: "relative",
    flex: 1,
    overflow: "hidden",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
  },
  statLabel: {
    marginTop: 5,
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "800",
  },
  statBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginVertical: SPACING.md,
  },
  filter: {
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.round,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 10,
    fontWeight: "900",
  },
  errorBox: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.danger,
    backgroundColor: "#DC262614",
  },
  error: {
    color: COLORS.danger,
    fontWeight: "800",
  },
  card: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  avatar: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "900",
  },
  main: {
    flex: 1,
  },
  name: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },
  subject: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  dueBox: {
    marginTop: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
  },
  dueIcon: {
    color: COLORS.info,
    fontSize: 18,
  },
  dueContent: {
    flex: 1,
  },
  due: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
  },
  overdue: {
    color: COLORS.danger,
  },
  meta: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 9,
  },
  notes: {
    marginTop: SPACING.md,
    color: COLORS.textSoft,
    fontSize: 11,
    lineHeight: 17,
  },
  actions: {
    marginTop: SPACING.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
});
