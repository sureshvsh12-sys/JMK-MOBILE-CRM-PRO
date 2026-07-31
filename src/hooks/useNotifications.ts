import { useCallback, useEffect, useMemo, useState } from "react";

import { refreshBusinessNotifications } from "../services/notificationsService";
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  markNotificationAsUnread,
  subscribeToNotificationChanges,
  type AppNotification,
  type NotificationModule,
} from "../storage/notificationStorage";

export type NotificationFilter = "All" | "Unread" | NotificationModule;

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (generateBusinessAlerts = false) => {
    try {
      setError("");
      const items = generateBusinessAlerts
        ? await refreshBusinessNotifications()
        : await getNotifications();
      setNotifications(items);
    } catch (loadError) {
      console.error("Unable to load notifications:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Notifications load nahi ho sake."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
    return subscribeToNotificationChanges(() => {
      void load(false);
    });
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load(true);
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const markRead = useCallback(async (id: string) => {
    await markNotificationAsRead(id);
  }, []);

  const toggleRead = useCallback(async (notification: AppNotification) => {
    if (notification.isRead) await markNotificationAsUnread(notification.id);
    else await markNotificationAsRead(notification.id);
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsAsRead();
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteNotification(id);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const highPriorityCount = useMemo(
    () =>
      notifications.filter(
        (item) => item.priority === "High" && !item.isRead
      ).length,
    [notifications]
  );

  const visibleNotifications = useMemo(() => {
    if (filter === "All") return notifications;
    if (filter === "Unread") return notifications.filter((item) => !item.isRead);
    return notifications.filter((item) => item.module === filter);
  }, [filter, notifications]);

  return {
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
  };
}
