import {
  getNotifications,
  removeGeneratedNotificationsExcept,
  upsertNotificationBySource,
  type AppNotification,
  type NotificationDraft,
} from "../storage/notificationStorage";
import { getFollowUps } from "../storage/followUpStorage";
import { getSyncQueue } from "../storage/syncStorage";

const FOLLOW_UP_SOURCE_PREFIX = "auto:followup:";
const SYNC_QUEUE_SOURCE_PREFIX = "auto:sync-queue:";

function startOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDueAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "scheduled time";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function refreshFollowUpNotifications(): Promise<void> {
  const followUps = await getFollowUps();
  const now = new Date();
  const today = startOfDay(now).getTime();
  const tomorrow = today + 24 * 60 * 60 * 1000;
  const activeSourceKeys: string[] = [];

  for (const followUp of followUps) {
    if (followUp.status !== "Pending") continue;

    const dueAt = new Date(followUp.dueAt);
    if (Number.isNaN(dueAt.getTime()) || dueAt.getTime() >= tomorrow) continue;

    const overdue = dueAt.getTime() < now.getTime();
    const sourceKey = `${FOLLOW_UP_SOURCE_PREFIX}${followUp.id}`;
    activeSourceKeys.push(sourceKey);

    await upsertNotificationBySource({
      sourceKey,
      title: overdue ? "Follow-up overdue" : "Follow-up due today",
      message: `${followUp.customerName || "Customer"} — ${followUp.subject || "Follow-up"} (${formatDueAt(followUp.dueAt)})`,
      module: "Follow-ups",
      priority: overdue || followUp.priority === "High" ? "High" : "Medium",
      route: "/followups",
    });
  }

  await removeGeneratedNotificationsExcept(
    FOLLOW_UP_SOURCE_PREFIX,
    activeSourceKeys
  );
}

async function refreshSyncQueueNotification(): Promise<void> {
  const queue = await getSyncQueue();
  const sourceKey = `${SYNC_QUEUE_SOURCE_PREFIX}pending`;

  if (queue.length === 0) {
    await removeGeneratedNotificationsExcept(SYNC_QUEUE_SOURCE_PREFIX, []);
    return;
  }

  await upsertNotificationBySource({
    sourceKey,
    title: "Cloud sync pending",
    message: `${queue.length} offline sync batch${queue.length === 1 ? "" : "es"} cloud upload ka wait kar rahe hain.`,
    module: "System",
    priority: queue.length >= 3 ? "High" : "Medium",
    route: "/settings",
  });

  await removeGeneratedNotificationsExcept(SYNC_QUEUE_SOURCE_PREFIX, [sourceKey]);
}

export async function refreshBusinessNotifications(): Promise<AppNotification[]> {
  const tasks = await Promise.allSettled([
    refreshFollowUpNotifications(),
    refreshSyncQueueNotification(),
  ]);

  tasks.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Unable to refresh business notification:", result.reason);
    }
  });

  return getNotifications();
}

export async function createBusinessNotification(
  notification: NotificationDraft
): Promise<AppNotification> {
  const { addNotification } = await import("../storage/notificationStorage");
  return addNotification(notification);
}
