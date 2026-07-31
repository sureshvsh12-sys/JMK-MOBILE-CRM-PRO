import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "jmk_mobile_notifications";
const listeners = new Set<() => void>();

export type NotificationPriority = "Low" | "Medium" | "High";
export type NotificationModule =
  | "Leads"
  | "Customers"
  | "Follow-ups"
  | "Bookings"
  | "Finance"
  | "Solar"
  | "Raw Contacts"
  | "System";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  module: NotificationModule;
  priority: NotificationPriority;
  isRead: boolean;
  route?: string;
  sourceKey?: string;
  createdAt: string;
  updatedAt?: string;
};

export type NotificationDraft = Omit<
  AppNotification,
  "id" | "createdAt" | "updatedAt" | "isRead"
> & {
  isRead?: boolean;
  createdAt?: string;
};

function createId(): string {
  return `notification-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeNotification(value: Partial<AppNotification>): AppNotification {
  const now = new Date().toISOString();
  return {
    id: String(value.id || createId()),
    title: String(value.title || "Notification").trim() || "Notification",
    message: String(value.message || "").trim(),
    module: value.module || "System",
    priority: value.priority || "Medium",
    isRead: Boolean(value.isRead),
    route: value.route ? String(value.route) : undefined,
    sourceKey: value.sourceKey ? String(value.sourceKey) : undefined,
    createdAt: value.createdAt || now,
    updatedAt: value.updatedAt || value.createdAt || now,
  };
}

function sortNotifications(notifications: AppNotification[]): AppNotification[] {
  return [...notifications].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  );
}

function emitChange(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error("Notification listener failed:", error);
    }
  });
}

async function saveNotifications(notifications: AppNotification[]): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(sortNotifications(notifications.map(normalizeNotification)))
  );
  emitChange();
}

export function subscribeToNotificationChanges(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function getNotifications(): Promise<AppNotification[]> {
  try {
    const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (!storedValue) return [];

    const parsed: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsed)) return [];

    return sortNotifications(
      parsed.map((item) => normalizeNotification(item as Partial<AppNotification>))
    );
  } catch (error) {
    console.error("Unable to load notifications:", error);
    return [];
  }
}

export async function addNotification(
  notification: NotificationDraft
): Promise<AppNotification> {
  const notifications = await getNotifications();
  const now = new Date().toISOString();
  const newNotification = normalizeNotification({
    ...notification,
    id: createId(),
    isRead: notification.isRead ?? false,
    createdAt: notification.createdAt ?? now,
    updatedAt: now,
  });

  await saveNotifications([newNotification, ...notifications]);
  return newNotification;
}

export async function upsertNotificationBySource(
  notification: NotificationDraft & { sourceKey: string }
): Promise<AppNotification> {
  const notifications = await getNotifications();
  const existing = notifications.find(
    (item) => item.sourceKey === notification.sourceKey
  );
  const now = new Date().toISOString();

  if (!existing) {
    return addNotification(notification);
  }

  const contentChanged =
    existing.title !== notification.title ||
    existing.message !== notification.message ||
    existing.priority !== notification.priority ||
    existing.module !== notification.module ||
    existing.route !== notification.route;

  const updated = normalizeNotification({
    ...existing,
    ...notification,
    id: existing.id,
    isRead: contentChanged ? false : existing.isRead,
    createdAt: contentChanged ? notification.createdAt || now : existing.createdAt,
    updatedAt: now,
  });

  await saveNotifications(
    notifications.map((item) => (item.id === existing.id ? updated : item))
  );
  return updated;
}

export async function removeNotificationsBySourceKeys(
  sourceKeys: string[]
): Promise<void> {
  if (sourceKeys.length === 0) return;
  const keySet = new Set(sourceKeys);
  const notifications = await getNotifications();
  const next = notifications.filter(
    (item) => !item.sourceKey || !keySet.has(item.sourceKey)
  );
  if (next.length !== notifications.length) await saveNotifications(next);
}

export async function removeGeneratedNotificationsExcept(
  sourcePrefix: string,
  activeSourceKeys: string[]
): Promise<void> {
  const active = new Set(activeSourceKeys);
  const notifications = await getNotifications();
  const next = notifications.filter((item) => {
    if (!item.sourceKey?.startsWith(sourcePrefix)) return true;
    return active.has(item.sourceKey);
  });

  if (next.length !== notifications.length) await saveNotifications(next);
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const notifications = await getNotifications();
  await saveNotifications(
    notifications.map((item) =>
      item.id === id ? { ...item, isRead: true, updatedAt: new Date().toISOString() } : item
    )
  );
}

export async function markNotificationAsUnread(id: string): Promise<void> {
  const notifications = await getNotifications();
  await saveNotifications(
    notifications.map((item) =>
      item.id === id ? { ...item, isRead: false, updatedAt: new Date().toISOString() } : item
    )
  );
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const notifications = await getNotifications();
  const now = new Date().toISOString();
  await saveNotifications(
    notifications.map((item) => ({ ...item, isRead: true, updatedAt: now }))
  );
}

export async function deleteNotification(id: string): Promise<void> {
  const notifications = await getNotifications();
  await saveNotifications(notifications.filter((item) => item.id !== id));
}

export async function clearNotifications(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  emitChange();
}

export async function getUnreadNotificationCount(): Promise<number> {
  const notifications = await getNotifications();
  return notifications.filter((item) => !item.isRead).length;
}
