import { Platform, Vibration } from "react-native";

import { addNotification } from "../storage/notificationStorage";
import { getSettings } from "../storage/settingsStorage";
import type { CrmRealtimeChange } from "./realtimeService";

let lastAlertKey = "";
let lastAlertAt = 0;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function createAlertKey(change: CrmRealtimeChange): string {
  const record = change.newRecord ?? {};
  return `${change.table}:${change.eventType}:${text(record.id) || change.occurredAt}`;
}

function playWebBeep(): void {
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

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.34);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.36);

    oscillator.addEventListener("ended", () => {
      void context.close();
    });
  } catch (error) {
    console.warn("Notification beep could not play:", error);
  }
}

function vibrate(): void {
  try {
    Vibration.vibrate(Platform.OS === "android" ? [0, 180, 100, 220] : 350);
  } catch (error) {
    console.warn("Notification vibration failed:", error);
  }
}

export async function handleRealtimeAlert(
  change: CrmRealtimeChange
): Promise<void> {
  if (change.table !== "raw_contacts" || change.eventType !== "INSERT") return;

  const settings = await getSettings();
  if (!settings.notificationsEnabled) return;

  const alertKey = createAlertKey(change);
  const now = Date.now();

  if (alertKey === lastAlertKey && now - lastAlertAt < 5000) return;
  lastAlertKey = alertKey;
  lastAlertAt = now;

  const record = change.newRecord ?? {};
  const id = text(record.id);
  const name = text(record.full_name || record.name) || "New enquiry";
  const mobile = text(record.mobile);
  const city = text(record.city || record.district);
  const segment = text(record.segment).toLowerCase();
  const segmentLabel =
    segment === "finance"
      ? "Finance"
      : segment === "solar"
        ? "Solar"
        : "Assets";

  const detail = [mobile, city].filter(Boolean).join(" • ");

  await addNotification({
    title: `New Website Enquiry • ${segmentLabel}`,
    message: `${name}${detail ? ` — ${detail}` : ""}`,
    module: "Raw Contacts",
    priority: "High",
    route: "/raw-contacts",
    sourceKey: id ? `website-enquiry:${id}` : alertKey,
    createdAt: text(record.created_at) || change.occurredAt,
  });

  playWebBeep();
  vibrate();
}
