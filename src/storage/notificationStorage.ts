import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "jmk_mobile_notifications";

export type NotificationPriority = "Low" | "Medium" | "High";
export type NotificationModule =
  | "Leads"
  | "Customers"
  | "Follow-ups"
  | "Bookings"
  | "Finance"
  | "Solar"
  | "System";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  module: NotificationModule;
  priority: NotificationPriority;
  isRead: boolean;
  route?: string;
  createdAt: string;
};

function createId(): string {
  return `notification-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function sortNotifications(
  notifications: AppNotification[]
): AppNotification[] {
  return [...notifications].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime()
  );
}

function getDefaultNotifications(): AppNotification[] {
  const now = Date.now();

  return [
    {
      id: createId(),
      title: "Today Follow-ups",
      message:
        "Aaj ke pending customer calls aur meetings check karein.",
      module: "Follow-ups",
      priority: "High",
      isRead: false,
      route: "/followups",
      createdAt: new Date(now).toISOString(),
    },
    {
      id: createId(),
      title: "Booking Collection",
      message:
        "Pending booking payments aur installments review karein.",
      module: "Bookings",
      priority: "Medium",
      isRead: false,
      route: "/bookings",
      createdAt: new Date(now - 60 * 60 * 1000).toISOString(),
    },
    {
      id: createId(),
      title: "Finance Summary",
      message:
        "Aaj ka income, expense aur current balance available hai.",
      module: "Finance",
      priority: "Low",
      isRead: true,
      route: "/finance",
      createdAt: new Date(
        now - 24 * 60 * 60 * 1000
      ).toISOString(),
    },
  ];
}

async function saveNotifications(
  notifications: AppNotification[]
): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(sortNotifications(notifications))
  );
}

export async function getNotifications(): Promise<
  AppNotification[]
> {
  try {
    const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      const defaults = getDefaultNotifications();
      await saveNotifications(defaults);
      return defaults;
    }

    const parsed = JSON.parse(storedValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortNotifications(parsed as AppNotification[]);
  } catch (error) {
    console.error("Unable to load notifications:", error);
    return [];
  }
}

export async function addNotification(
  notification: Omit<AppNotification, "id" | "createdAt" | "isRead"> & {
    isRead?: boolean;
    createdAt?: string;
  }
): Promise<AppNotification> {
  const notifications = await getNotifications();

  const newNotification: AppNotification = {
    ...notification,
    id: createId(),
    isRead: notification.isRead ?? false,
    createdAt:
      notification.createdAt ?? new Date().toISOString(),
  };

  await saveNotifications([
    newNotification,
    ...notifications,
  ]);

  return newNotification;
}

export async function markNotificationAsRead(
  id: string
): Promise<void> {
  const notifications = await getNotifications();

  await saveNotifications(
    notifications.map((notification) =>
      notification.id === id
        ? {
            ...notification,
            isRead: true,
          }
        : notification
    )
  );
}

export async function markNotificationAsUnread(
  id: string
): Promise<void> {
  const notifications = await getNotifications();

  await saveNotifications(
    notifications.map((notification) =>
      notification.id === id
        ? {
            ...notification,
            isRead: false,
          }
        : notification
    )
  );
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const notifications = await getNotifications();

  await saveNotifications(
    notifications.map((notification) => ({
      ...notification,
      isRead: true,
    }))
  );
}

export async function deleteNotification(
  id: string
): Promise<void> {
  const notifications = await getNotifications();

  await saveNotifications(
    notifications.filter(
      (notification) => notification.id !== id
    )
  );
}

export async function clearNotifications(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const notifications = await getNotifications();

  return notifications.filter(
    (notification) => !notification.isRead
  ).length;
}