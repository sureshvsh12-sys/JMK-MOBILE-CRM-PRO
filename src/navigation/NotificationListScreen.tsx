import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../components/AppHeader";
import { COLORS, RADIUS, SPACING } from "../constants/theme";
import {
  type NotificationFilter,
  useNotifications,
} from "../hooks/useNotifications";
import {
  type AppNotification,
  type NotificationModule,
} from "../storage/notificationStorage";

const FILTERS: NotificationFilter[] = [
  "All",
  "Unread",
  "Follow-ups",
  "Bookings",
  "Finance",
  "Solar",
  "Raw Contacts",
  "System",
];

export default function NotificationListScreen() {
  const {
    notifications,
    visibleNotifications,
    filter,
    setFilter,
    loading,
    refreshing,
    error,
    unreadCount,
    highPriorityCount,
    load,
    refresh,
    markRead,
    toggleRead,
    markAllRead,
    remove,
  } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load])
  );

  const handleOpenNotification = async (
    notification: AppNotification
  ) => {
    if (!notification.isRead) await markRead(notification.id);
    if (notification.route) router.push(notification.route as never);
  };

  const handleDelete = (notification: AppNotification) => {
    Alert.alert(
      "Delete Notification",
      "Kya aap ye notification delete karna chahte hain?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void remove(notification.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader
        segment="Notification Center"
        notificationCount={unreadCount}
        onNotificationPress={() => undefined}
      />

      <View style={styles.container}>
        <View style={styles.headingRow}>
          <View style={styles.headingContent}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              Important business updates ek jagah dekhein
            </Text>
          </View>

          {unreadCount > 0 ? (
            <Pressable
              style={({ pressed }) => [
                styles.markAllButton,
                pressed && styles.pressed,
              ]}
              onPress={() => void markAllRead()}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Total" value={notifications.length} />
          <StatCard label="Unread" value={unreadCount} highlighted />
          <StatCard label="High Priority" value={highPriorityCount} danger />
        </View>

        <View style={styles.filters}>
          {FILTERS.map((item) => {
            const active = filter === item;
            return (
              <Pressable
                key={item}
                style={[
                  styles.filterButton,
                  active && styles.filterButtonActive,
                ]}
                onPress={() => setFilter(item)}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading && notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.emptyText}>Notifications load ho rahe hain...</Text>
          </View>
        ) : (
          <FlatList
            data={visibleNotifications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                tintColor={COLORS.primary}
                onRefresh={() => void refresh()}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔔</Text>
                <Text style={styles.emptyTitle}>No notifications</Text>
                <Text style={styles.emptyText}>
                  Is filter me abhi koi notification nahi hai.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <NotificationCard
                notification={item}
                onOpen={() => void handleOpenNotification(item)}
                onToggleRead={() => void toggleRead(item)}
                onDelete={() => handleDelete(item)}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

type StatCardProps = {
  label: string;
  value: number;
  highlighted?: boolean;
  danger?: boolean;
};

function StatCard({
  label,
  value,
  highlighted = false,
  danger = false,
}: StatCardProps) {
  return (
    <View
      style={[
        styles.statCard,
        highlighted && styles.statCardHighlighted,
      ]}
    >
      <Text
        style={[
          styles.statValue,
          danger && styles.statValueDanger,
        ]}
      >
        {value}
      </Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type NotificationCardProps = {
  notification: AppNotification;
  onOpen: () => void;
  onToggleRead: () => void;
  onDelete: () => void;
};

function NotificationCard({
  notification,
  onOpen,
  onToggleRead,
  onDelete,
}: NotificationCardProps) {
  const moduleIcon = getModuleIcon(
    notification.module
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        !notification.isRead && styles.cardUnread,
        pressed && styles.pressed,
      ]}
      onPress={onOpen}
    >
      <View style={styles.cardTop}>
        <View
          style={[
            styles.iconContainer,
            !notification.isRead &&
              styles.iconContainerUnread,
          ]}
        >
          <Text style={styles.moduleIcon}>
            {moduleIcon}
          </Text>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardTitleRow}>
            <Text
              style={[
                styles.cardTitle,
                !notification.isRead &&
                  styles.cardTitleUnread,
              ]}
              numberOfLines={1}
            >
              {notification.title}
            </Text>

            {!notification.isRead ? (
              <View style={styles.unreadDot} />
            ) : null}
          </View>

          <Text
            style={styles.cardMessage}
            numberOfLines={3}
          >
            {notification.message}
          </Text>

          <View style={styles.cardMetaRow}>
            <ModuleBadge
              module={notification.module}
            />

            <PriorityBadge
              priority={notification.priority}
            />

            <Text style={styles.dateText}>
              {formatDate(notification.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={(event) => {
            event.stopPropagation();
            onToggleRead();
          }}
        >
          <Text style={styles.actionText}>
            {notification.isRead
              ? "Mark unread"
              : "Mark read"}
          </Text>
        </Pressable>

        {notification.route ? (
          <Pressable
            style={styles.actionButton}
            onPress={(event) => {
              event.stopPropagation();
              onOpen();
            }}
          >
            <Text style={styles.openText}>
              Open Module
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          style={styles.actionButton}
          onPress={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <Text style={styles.deleteText}>
            Delete
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function ModuleBadge({
  module,
}: {
  module: NotificationModule;
}) {
  return (
    <View style={styles.moduleBadge}>
      <Text style={styles.moduleBadgeText}>
        {module}
      </Text>
    </View>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: AppNotification["priority"];
}) {
  return (
    <View
      style={[
        styles.priorityBadge,
        priority === "High" &&
          styles.priorityBadgeHigh,
        priority === "Low" &&
          styles.priorityBadgeLow,
      ]}
    >
      <Text style={styles.priorityBadgeText}>
        {priority}
      </Text>
    </View>
  );
}

function getModuleIcon(
  module: NotificationModule
): string {
  const iconMap: Record<NotificationModule, string> = {
    Leads: "🎯",
    Customers: "👥",
    "Follow-ups": "📅",
    Bookings: "🏠",
    Finance: "₹",
    Solar: "☀️",
    System: "⚙️",
  };

  return iconMap[module];
}

function formatDate(value: string): string {
  const date = new Date(value);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
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

  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
  },

  headingContent: {
    flex: 1,
  },

  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
  },

  subtitle: {
    color: COLORS.textMuted,
    marginTop: 4,
    fontSize: 12,
  },

  markAllButton: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  markAllText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: "900",
  },

  statsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },

  statCard: {
    flex: 1,
    minHeight: 78,
    justifyContent: "center",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statCardHighlighted: {
    borderColor: COLORS.primary,
  },

  statValue: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
  },

  statValueDanger: {
    color: COLORS.danger,
  },

  statLabel: {
    color: COLORS.textMuted,
    marginTop: 4,
    fontSize: 10,
    fontWeight: "700",
  },

  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },

  filterButton: {
    paddingHorizontal: 12,
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
    fontSize: 10,
    fontWeight: "800",
  },

  filterTextActive: {
    color: COLORS.white,
  },

  list: {
    paddingTop: SPACING.lg,
    paddingBottom: 32,
  },

  card: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardUnread: {
    borderColor: COLORS.primary,
    backgroundColor: "#121E33",
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  iconContainer: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
  },

  iconContainerUnread: {
    backgroundColor: COLORS.primaryDark,
  },

  moduleIcon: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
  },

  cardContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  cardTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },

  cardTitleUnread: {
    fontWeight: "900",
  },

  unreadDot: {
    width: 9,
    height: 9,
    marginLeft: SPACING.sm,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  cardMessage: {
    color: COLORS.textMuted,
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
  },

  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: SPACING.md,
  },

  moduleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceLight,
  },

  moduleBadgeText: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: "800",
  },

  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.warning,
  },

  priorityBadgeHigh: {
    backgroundColor: COLORS.danger,
  },

  priorityBadgeLow: {
    backgroundColor: COLORS.info,
  },

  priorityBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "900",
  },

  dateText: {
    color: COLORS.textMuted,
    marginLeft: "auto",
    fontSize: 9,
    fontWeight: "700",
  },

  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
  },

  actionText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "800",
  },

  openText: {
    color: COLORS.info,
    fontSize: 9,
    fontWeight: "900",
  },

  deleteText: {
    color: COLORS.danger,
    fontSize: 9,
    fontWeight: "900",
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 70,
    paddingHorizontal: SPACING.xl,
  },

  emptyIcon: {
    fontSize: 42,
  },

  emptyTitle: {
    color: COLORS.text,
    marginTop: SPACING.md,
    fontSize: 17,
    fontWeight: "900",
  },

  emptyText: {
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
  },

  errorText: {
    marginBottom: SPACING.sm,
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: "700",
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