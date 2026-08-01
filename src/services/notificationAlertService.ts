import { Platform, Vibration } from "react-native";

import {
  addNotification,
  type NotificationModule,
  type NotificationPriority,
} from "../storage/notificationStorage";
import { getSettings } from "../storage/settingsStorage";
import type {
  CrmRealtimeChange,
  CrmRealtimeTable,
} from "./realtimeService";

let lastAlertKey = "";
let lastAlertAt = 0;

const ROUTES: Record<CrmRealtimeTable, string> = {
  raw_contacts: "/raw-contacts",
  leads: "/leads",
  customers: "/customers",
  followups: "/followups",
  bookings: "/bookings",
  finance: "/finance",
  solar: "/solar",
};

const MODULES: Record<CrmRealtimeTable, NotificationModule> = {
  raw_contacts: "Raw Contacts",
  leads: "Leads",
  customers: "Customers",
  followups: "Follow-ups",
  bookings: "Bookings",
  finance: "Finance",
  solar: "Solar",
};

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: unknown): string {
  const amount = numberValue(value);
  if (!amount) return "";

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${Math.round(amount).toLocaleString("en-IN")}`;
  }
}

function dateTime(value: unknown): string {
  const raw = text(value);
  if (!raw) return "";

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;

  try {
    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return raw;
  }
}

function firstText(
  record: Record<string, unknown>,
  keys: readonly string[]
): string {
  for (const key of keys) {
    const value = text(record[key]);
    if (value) return value;
  }
  return "";
}

function createAlertKey(change: CrmRealtimeChange): string {
  const record = change.newRecord ?? change.oldRecord ?? {};
  return `${change.table}:${change.eventType}:${text(record.id) || change.occurredAt}`;
}

function playWebBeep(priority: NotificationPriority): void {
  if (Platform.OS !== "web" || typeof window === "undefined") return;

  try {
    const WebAudioContext =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!WebAudioContext) return;

    const context = new WebAudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequency = priority === "High" ? 920 : priority === "Medium" ? 760 : 620;

    oscillator.type = priority === "High" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.32);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.34);

    oscillator.addEventListener("ended", () => {
      void context.close();
    });
  } catch (error) {
    console.warn("Notification beep could not play:", error);
  }
}

function vibrate(priority: NotificationPriority): void {
  try {
    if (Platform.OS === "android") {
      Vibration.vibrate(
        priority === "High"
          ? [0, 180, 100, 220]
          : priority === "Medium"
            ? [0, 140]
            : [0, 90]
      );
      return;
    }

    Vibration.vibrate(priority === "High" ? 350 : 180);
  } catch (error) {
    console.warn("Notification vibration failed:", error);
  }
}

function segmentLabel(record: Record<string, unknown>): string {
  const segment = firstText(record, ["segment", "business_segment", "category"])
    .toLowerCase();

  if (segment === "finance" || segment.includes("financial")) return "Finance";
  if (segment === "solar" || segment.includes("solar")) return "Solar";
  if (segment === "assets" || segment.includes("property") || segment.includes("real")) {
    return "Assets";
  }

  return "JMK";
}

function eventLabel(eventType: CrmRealtimeChange["eventType"]): string {
  if (eventType === "INSERT") return "New";
  if (eventType === "UPDATE") return "Updated";
  if (eventType === "DELETE") return "Deleted";
  return "Changed";
}

function buildRawContactAlert(
  change: CrmRealtimeChange,
  record: Record<string, unknown>
) {
  const name = firstText(record, ["full_name", "name"]) || "New enquiry";
  const mobile = firstText(record, ["mobile", "phone"]);
  const city = firstText(record, ["city", "district", "location"]);
  const detail = [mobile, city].filter(Boolean).join(" • ");

  return {
    title: `${eventLabel(change.eventType)} Website Enquiry • ${segmentLabel(record)}`,
    message: `${name}${detail ? ` — ${detail}` : ""}`,
    priority: "High" as const,
  };
}

function buildLeadAlert(
  change: CrmRealtimeChange,
  record: Record<string, unknown>
) {
  const name = firstText(record, ["customer_name", "full_name", "name", "lead_name"]) || "Lead";
  const stage = firstText(record, ["stage", "status"]);
  const value = money(record.estimated_value ?? record.value ?? record.amount);
  const details = [stage, value].filter(Boolean).join(" • ");

  return {
    title: `${eventLabel(change.eventType)} Lead • ${segmentLabel(record)}`,
    message: `${name}${details ? ` — ${details}` : ""}`,
    priority: change.eventType === "INSERT" ? ("High" as const) : ("Medium" as const),
  };
}

function buildCustomerAlert(
  change: CrmRealtimeChange,
  record: Record<string, unknown>
) {
  const name = firstText(record, ["full_name", "name", "customer_name"]) || "Customer";
  const mobile = firstText(record, ["mobile", "phone"]);

  return {
    title: `${eventLabel(change.eventType)} Customer • ${segmentLabel(record)}`,
    message: `${name}${mobile ? ` — ${mobile}` : ""}`,
    priority: change.eventType === "INSERT" ? ("High" as const) : ("Medium" as const),
  };
}

function buildFollowupAlert(
  change: CrmRealtimeChange,
  record: Record<string, unknown>
) {
  const name = firstText(record, ["customer_name", "contact_name", "name", "title"]) || "Follow-up";
  const scheduledAt = dateTime(
    record.callback_at ??
      record.followup_at ??
      record.scheduled_at ??
      record.due_date ??
      record.date
  );
  const status = firstText(record, ["status", "result"]);
  const details = [scheduledAt, status].filter(Boolean).join(" • ");

  return {
    title: `${eventLabel(change.eventType)} Follow-up`,
    message: `${name}${details ? ` — ${details}` : ""}`,
    priority: "High" as const,
  };
}

function buildBookingAlert(
  change: CrmRealtimeChange,
  record: Record<string, unknown>
) {
  const customer = firstText(record, ["customer_name", "name"]) || "Booking";
  const property = firstText(record, ["property_name", "plot_number", "unit_number", "project_name"]);
  const amount = money(record.total_amount ?? record.booking_amount ?? record.amount);
  const details = [property, amount].filter(Boolean).join(" • ");

  return {
    title: `${eventLabel(change.eventType)} Booking`,
    message: `${customer}${details ? ` — ${details}` : ""}`,
    priority: change.eventType === "INSERT" ? ("High" as const) : ("Medium" as const),
  };
}

function buildFinanceAlert(
  change: CrmRealtimeChange,
  record: Record<string, unknown>
) {
  const type = firstText(record, ["type", "entry_type", "transaction_type"]);
  const category = firstText(record, ["category", "title", "description"]);
  const amount = money(record.amount ?? record.total ?? record.value);
  const details = [category, amount].filter(Boolean).join(" • ");

  return {
    title: `${eventLabel(change.eventType)} Finance Entry${type ? ` • ${type}` : ""}`,
    message: details || "Finance record changed",
    priority: "Medium" as const,
  };
}

function buildSolarAlert(
  change: CrmRealtimeChange,
  record: Record<string, unknown>
) {
  const customer = firstText(record, ["customer_name", "full_name", "name"]) || "Solar project";
  const capacity = numberValue(record.capacity_kw ?? record.system_size ?? record.kw);
  const status = firstText(record, ["status", "stage"]);
  const details = [capacity ? `${capacity} kW` : "", status].filter(Boolean).join(" • ");

  return {
    title: `${eventLabel(change.eventType)} Solar Project`,
    message: `${customer}${details ? ` — ${details}` : ""}`,
    priority: change.eventType === "INSERT" ? ("High" as const) : ("Medium" as const),
  };
}

function buildAlert(change: CrmRealtimeChange) {
  const record = change.newRecord ?? change.oldRecord ?? {};

  switch (change.table) {
    case "raw_contacts":
      return buildRawContactAlert(change, record);
    case "leads":
      return buildLeadAlert(change, record);
    case "customers":
      return buildCustomerAlert(change, record);
    case "followups":
      return buildFollowupAlert(change, record);
    case "bookings":
      return buildBookingAlert(change, record);
    case "finance":
      return buildFinanceAlert(change, record);
    case "solar":
      return buildSolarAlert(change, record);
  }
}

export async function handleRealtimeAlert(
  change: CrmRealtimeChange
): Promise<void> {
  const settings = await getSettings();
  if (!settings.notificationsEnabled) return;

  const alertKey = createAlertKey(change);
  const now = Date.now();

  if (alertKey === lastAlertKey && now - lastAlertAt < 5000) return;
  lastAlertKey = alertKey;
  lastAlertAt = now;

  const record = change.newRecord ?? change.oldRecord ?? {};
  const recordId = text(record.id);
  const alert = buildAlert(change);

  await addNotification({
    title: alert.title,
    message: alert.message,
    module: MODULES[change.table],
    priority: alert.priority,
    route: ROUTES[change.table],
    sourceKey: recordId
      ? `realtime:${change.table}:${recordId}:${change.eventType}`
      : alertKey,
    createdAt:
      firstText(record, ["updated_at", "created_at"]) || change.occurredAt,
  });

  playWebBeep(alert.priority);
  vibrate(alert.priority);
}
