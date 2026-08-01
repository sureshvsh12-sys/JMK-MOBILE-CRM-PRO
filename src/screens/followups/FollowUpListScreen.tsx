import { useCallback } from "react";
import {
  Alert,
  BackHandler,
  FlatList,
  Linking,
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
import { BottomTabInset, COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import { useFollowups } from "../../hooks/useFollowups";
import type { FollowUp, FollowUpStatus } from "../../services/followupsService";

const FILTERS: Array<"All" | FollowUpStatus> = [
  "All",
  "Pending",
  "Completed",
  "Cancelled",
];

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
    remove: removeFollowUp,
  } = useFollowups();

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        router.replace("/dashboard");
        return true;
      });

      return () => subscription.remove();
    }, [])
  );

  const now = Date.now();
  const todayKey = getLocalDateKey(new Date());
  const pendingCount = items.filter((item) => item.status === "Pending").length;
  const todayCount = items.filter(
    (item) => item.status === "Pending" && getLocalDateKey(new Date(item.dueAt)) === todayKey
  ).length;
  const overdueCount = items.filter(
    (item) => item.status === "Pending" && new Date(item.dueAt).getTime() < now
  ).length;

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/dashboard");
  };

  const remove = (item: FollowUp) => {
    Alert.alert(
      "Delete Follow-up",
      `${item.customerName} ka follow-up permanently delete karna hai?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await removeFollowUp(item.id);
          },
        },
      ]
    );
  };

  const callCustomer = async (mobile: string) => {
    const cleanMobile = mobile.replace(/\D/g, "");
    const url = `tel:${cleanMobile}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Call unavailable", "Is device par calling available nahi hai.");
      return;
    }
    await Linking.openURL(url);
  };

  const openWhatsApp = async (mobile: string) => {
    const cleanMobile = mobile.replace(/\D/g, "");
    const normalizedMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
    const url = `https://wa.me/${normalizedMobile}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("WhatsApp unavailable", "WhatsApp link open nahi ho saka.");
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader
        segment="Follow-ups"
        onMenuPress={() => router.replace("/dashboard")}
        onNotificationPress={() => router.push("/notifications")}
        onProfilePress={() => router.push("/settings")}
      />

      <View style={styles.navigationRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={goBack}
        >
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add follow-up"
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          onPress={() => router.push("/followup-form" as never)}
        >
          <Text style={styles.primaryButtonText}>＋ New Follow-up</Text>
        </Pressable>
      </View>

      <View style={styles.container}>
        <View style={styles.headingBlock}>
          <Text style={styles.eyebrow}>SALES ACTIVITY</Text>
          <Text style={styles.title}>Follow-ups</Text>
          <Text style={styles.subtitle}>Calls, WhatsApp, meetings aur site visits track karein.</Text>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Pending" value={pendingCount} tone="info" />
          <Stat label="Due Today" value={todayCount} tone="warning" />
          <Stat label="Overdue" value={overdueCount} tone="danger" />
        </View>

        <View style={styles.searchShell}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, mobile, subject or mode"
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search ? (
            <Pressable accessibilityLabel="Clear search" onPress={() => setSearch("")}>
              <Text style={styles.clearSearch}>×</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filters}>
          {FILTERS.map((item) => (
            <Pressable
              key={item}
              style={({ pressed }) => [
                styles.filter,
                filter === item && styles.filterActive,
                pressed && styles.pressed,
              ]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, filtered.length === 0 && styles.emptyList]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
              onRefresh={() => void refresh()}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>✓</Text>
              <Text style={styles.emptyTitle}>No follow-ups found</Text>
              <Text style={styles.emptyText}>
                Search ya filter change karein, ya naya follow-up add karein.
              </Text>
              <Pressable
                style={styles.emptyButton}
                onPress={() => router.push("/followup-form" as never)}
              >
                <Text style={styles.emptyButtonText}>Add Follow-up</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => {
            const dueState = getDueState(item);
            return (
              <View style={[styles.card, dueState === "overdue" && styles.cardOverdue]}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.customerName.charAt(0).toUpperCase() || "J"}
                    </Text>
                  </View>

                  <View style={styles.cardMain}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.customerName}
                    </Text>
                    <Text style={styles.subject} numberOfLines={2}>
                      {item.subject}
                    </Text>
                  </View>

                  <StatusBadge status={item.status} />
                </View>

                <View style={styles.scheduleRow}>
                  <Text style={styles.scheduleIcon}>{getModeIcon(item.mode)}</Text>
                  <View style={styles.scheduleTextBlock}>
                    <Text style={[styles.scheduleDate, dueState === "overdue" && styles.overdueText]}>
                      {formatDate(item.dueAt)}
                    </Text>
                    <Text style={styles.meta}>
                      {item.mode} • {item.priority} priority
                    </Text>
                  </View>
                  {dueState === "overdue" && item.status === "Pending" ? (
                    <Text style={styles.overdueLabel}>OVERDUE</Text>
                  ) : null}
                </View>

                {item.notes ? (
                  <Text style={styles.notes} numberOfLines={3}>
                    {item.notes}
                  </Text>
                ) : null}

                <View style={styles.actions}>
                  <Action label="Call" icon="☎" onPress={() => void callCustomer(item.mobile)} />
                  <Action
                    label="WhatsApp"
                    icon="◉"
                    onPress={() => void openWhatsApp(item.mobile)}
                  />
                  {item.status === "Pending" ? (
                    <Action
                      label="Complete"
                      icon="✓"
                      emphasis
                      onPress={async () => {
                        await updateStatus(item.id, "Completed");
                      }}
                    />
                  ) : null}
                </View>

                <View style={styles.secondaryActions}>
                  <Pressable
                    style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
                    onPress={() =>
                      router.push({ pathname: "/followup-form", params: { id: item.id } } as never)
                    }
                  >
                    <Text style={styles.editText}>Edit</Text>
                  </Pressable>
                  <View style={styles.actionDivider} />
                  <Pressable
                    style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
                    onPress={() => remove(item)}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDueState(item: FollowUp): "normal" | "today" | "overdue" {
  if (item.status !== "Pending") return "normal";
  const dueTime = new Date(item.dueAt).getTime();
  if (dueTime < Date.now()) return "overdue";
  if (getLocalDateKey(new Date(item.dueAt)) === getLocalDateKey(new Date())) return "today";
  return "normal";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getModeIcon(mode: FollowUp["mode"]): string {
  if (mode === "WhatsApp") return "◉";
  if (mode === "Meeting") return "◆";
  if (mode === "Visit") return "⌂";
  return "☎";
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "info" | "warning" | "danger";
}) {
  const toneStyle =
    tone === "danger"
      ? styles.statDanger
      : tone === "warning"
        ? styles.statWarning
        : styles.statInfo;

  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, toneStyle]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: FollowUpStatus }) {
  return (
    <View
      style={[
        styles.badge,
        status === "Completed" && styles.badgeDone,
        status === "Cancelled" && styles.badgeCancelled,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          status === "Completed" && styles.badgeTextDone,
          status === "Cancelled" && styles.badgeTextCancelled,
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

function Action({
  label,
  icon,
  emphasis = false,
  onPress,
}: {
  label: string;
  icon: string;
  emphasis?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionButton,
        emphasis && styles.actionButtonEmphasis,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.actionIcon, emphasis && styles.actionTextEmphasis]}>{icon}</Text>
      <Text style={[styles.actionText, emphasis && styles.actionTextEmphasis]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  navigationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  backButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backIcon: { color: COLORS.text, marginRight: 7, fontSize: 28, lineHeight: 29, fontWeight: "700" },
  backText: { color: COLORS.text, fontSize: 12, fontWeight: "900" },
  primaryButton: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  container: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  headingBlock: { marginBottom: SPACING.md },
  eyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.6 },
  title: { color: COLORS.text, fontSize: 27, fontWeight: "900", marginTop: 4 },
  subtitle: { color: COLORS.textMuted, marginTop: 5, fontSize: 12, lineHeight: 18 },
  statsRow: { flexDirection: "row", gap: SPACING.sm },
  stat: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  statValue: { fontSize: 22, fontWeight: "900" },
  statInfo: { color: COLORS.info },
  statWarning: { color: COLORS.warning },
  statDanger: { color: COLORS.danger },
  statLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: "700", marginTop: 3 },
  searchShell: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
  },
  searchIcon: { color: COLORS.textMuted, fontSize: 22, marginRight: 9 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 13, paddingVertical: 0 },
  clearSearch: { color: COLORS.textMuted, fontSize: 23, paddingHorizontal: 4 },
  filters: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md, flexWrap: "wrap" },
  filter: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.textMuted, fontWeight: "800", fontSize: 11 },
  filterTextActive: { color: COLORS.white },
  list: { paddingTop: SPACING.lg, paddingBottom: BottomTabInset + 28 },
  emptyList: { flexGrow: 1 },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOW,
  },
  cardOverdue: { borderColor: "rgba(220,38,38,0.55)" },
  cardTop: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: COLORS.primary, fontSize: 18, fontWeight: "900" },
  cardMain: { flex: 1, marginHorizontal: SPACING.md },
  name: { color: COLORS.text, fontSize: 16, fontWeight: "900" },
  subject: { color: COLORS.textSoft, marginTop: 4, fontSize: 12, lineHeight: 17 },
  badge: {
    backgroundColor: "rgba(245,158,11,0.18)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.38)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
  },
  badgeDone: { backgroundColor: "rgba(22,163,74,0.18)", borderColor: "rgba(22,163,74,0.38)" },
  badgeCancelled: { backgroundColor: COLORS.surfaceLight, borderColor: COLORS.border },
  badgeText: { color: "#9A6700", fontWeight: "900", fontSize: 8 },
  badgeTextDone: { color: "#047857" },
  badgeTextCancelled: { color: COLORS.textMuted },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
  },
  scheduleIcon: { color: COLORS.text, fontSize: 20, width: 30, textAlign: "center" },
  scheduleTextBlock: { flex: 1, marginLeft: SPACING.sm },
  scheduleDate: { color: COLORS.text, fontSize: 12, fontWeight: "900" },
  meta: { color: COLORS.textMuted, marginTop: 3, fontSize: 10 },
  overdueText: { color: COLORS.danger },
  overdueLabel: { color: COLORS.danger, fontWeight: "900", fontSize: 8, letterSpacing: 0.8 },
  notes: { color: COLORS.textMuted, marginTop: SPACING.md, lineHeight: 18, fontSize: 12 },
  actions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg },
  actionButton: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonEmphasis: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  actionIcon: { color: COLORS.text, fontSize: 13, fontWeight: "900", marginRight: 5 },
  actionText: { color: COLORS.text, fontWeight: "900", fontSize: 10 },
  actionTextEmphasis: { color: COLORS.white },
  secondaryActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: SPACING.md,
  },
  textButton: { paddingHorizontal: 9, paddingVertical: 5 },
  actionDivider: { width: 1, height: 12, backgroundColor: COLORS.border },
  editText: { color: COLORS.info, fontSize: 10, fontWeight: "900" },
  deleteText: { color: COLORS.danger, fontSize: 10, fontWeight: "900" },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: 48,
    marginTop: 32,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    lineHeight: 58,
    textAlign: "center",
    borderRadius: 29,
    overflow: "hidden",
    color: COLORS.success,
    backgroundColor: "rgba(22,163,74,0.14)",
    fontSize: 25,
    fontWeight: "900",
  },
  emptyTitle: { color: COLORS.text, fontSize: 17, fontWeight: "900", marginTop: SPACING.lg },
  emptyText: { color: COLORS.textMuted, textAlign: "center", marginTop: 7, lineHeight: 19, fontSize: 12 },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
  },
  emptyButtonText: { color: COLORS.white, fontWeight: "900", fontSize: 12 },
});
