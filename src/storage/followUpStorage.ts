import AsyncStorage from "@react-native-async-storage/async-storage";

import { isSupabaseConfigured, supabase } from "../services/supabase";

export type FollowUpStatus = "Pending" | "Completed" | "Cancelled";
export type FollowUpPriority = "Low" | "Medium" | "High";
export type FollowUpMode = "Call" | "WhatsApp" | "Meeting" | "Visit";

export type FollowUp = {
  id: string;
  customerId: string;
  customerName: string;
  mobile: string;
  subject: string;
  notes: string;
  dueAt: string;
  status: FollowUpStatus;
  priority: FollowUpPriority;
  mode: FollowUpMode;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
};

export type FollowUpInput = Omit<FollowUp, "id" | "createdAt" | "updatedAt">;

const TABLE = "followups";
const STORAGE_KEY = "jmk_mobile_followups";
const LEGACY_DEMO_IDS = new Set(["followup-1"]);

type CloudFollowUpRow = {
  id?: string | number | null;
  customer_id?: string | null;
  customer?: string | null;
  mobile?: string | null;
  property?: string | null;
  date?: string | null;
  time?: string | null;
  status?: string | null;
  remark?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function createId(): string {
  return `followup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanMobile(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeStatus(value: unknown): FollowUpStatus {
  const status = String(value ?? "").trim().toLowerCase();
  if (status === "completed") return "Completed";
  if (status === "cancelled" || status === "canceled") return "Cancelled";
  return "Pending";
}

function normalizePriority(value: unknown): FollowUpPriority {
  const priority = String(value ?? "").trim().toLowerCase();
  if (priority === "low") return "Low";
  if (priority === "high") return "High";
  return "Medium";
}

function normalizeMode(value: unknown): FollowUpMode {
  const mode = String(value ?? "").trim().toLowerCase();
  if (mode === "whatsapp") return "WhatsApp";
  if (mode === "meeting") return "Meeting";
  if (mode === "visit") return "Visit";
  return "Call";
}

function normalize(value: Partial<FollowUp>): FollowUp {
  const now = new Date().toISOString();
  return {
    id: String(value.id || createId()),
    customerId: String(value.customerId || ""),
    customerName: String(value.customerName || "").trim(),
    mobile: cleanMobile(value.mobile),
    subject: String(value.subject || "").trim(),
    notes: String(value.notes || "").trim(),
    dueAt: value.dueAt || now,
    status: normalizeStatus(value.status),
    priority: normalizePriority(value.priority),
    mode: normalizeMode(value.mode),
    assignedTo: String(value.assignedTo || "Admin").trim() || "Admin",
    createdAt: value.createdAt || now,
    updatedAt: value.updatedAt || now,
  };
}

function localDateParts(isoValue: string): { date: string; time: string } {
  const parsed = new Date(isoValue);
  const safeDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const year = safeDate.getFullYear();
  const month = String(safeDate.getMonth() + 1).padStart(2, "0");
  const day = String(safeDate.getDate()).padStart(2, "0");
  const hour = String(safeDate.getHours()).padStart(2, "0");
  const minute = String(safeDate.getMinutes()).padStart(2, "0");
  return { date: `${year}-${month}-${day}`, time: `${hour}:${minute}` };
}

function cloudDateTime(dateValue: unknown, timeValue: unknown): string {
  const date = String(dateValue ?? "").trim();
  const time = String(timeValue ?? "").trim() || "10:00";
  const parsed = new Date(`${date}T${time.length === 5 ? `${time}:00` : time}`);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function fromCloud(row: CloudFollowUpRow, local?: FollowUp): FollowUp {
  const createdAt = row.created_at || local?.createdAt || new Date().toISOString();
  return normalize({
    id: String(row.id ?? local?.id ?? createId()),
    customerId: row.customer_id || local?.customerId || "",
    customerName: row.customer || local?.customerName || "",
    mobile: row.mobile || local?.mobile || "",
    subject: row.property || local?.subject || "Follow-up",
    notes: row.remark || local?.notes || "",
    dueAt: cloudDateTime(row.date, row.time),
    status: normalizeStatus(row.status),
    priority: local?.priority || "Medium",
    mode: local?.mode || "Call",
    assignedTo: local?.assignedTo || "Suresh Vishwakarma",
    createdAt,
    updatedAt: row.updated_at || local?.updatedAt || createdAt,
  });
}

function toCloud(input: FollowUpInput | Partial<FollowUp>) {
  const dueAt = input.dueAt || new Date().toISOString();
  const { date, time } = localDateParts(dueAt);
  return {
    customer_id: input.customerId || null,
    customer: String(input.customerName || "").trim(),
    mobile: cleanMobile(input.mobile),
    property: String(input.subject || "").trim(),
    date,
    time,
    status: normalizeStatus(input.status),
    remark: String(input.notes || "").trim(),
    updated_at: new Date().toISOString(),
  };
}

async function readLocal(): Promise<FollowUp[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalize(item as Partial<FollowUp>))
      .filter((item) => !LEGACY_DEMO_IDS.has(item.id));
  } catch (error) {
    console.error("Unable to read local follow-ups:", error);
    return [];
  }
}

async function writeLocal(items: FollowUp[]): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items.filter((item) => !LEGACY_DEMO_IDS.has(item.id)))
  );
}

function sortFollowUps(items: FollowUp[]): FollowUp[] {
  return [...items].sort((a, b) => {
    if (a.status === "Pending" && b.status !== "Pending") return -1;
    if (a.status !== "Pending" && b.status === "Pending") return 1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

export async function getFollowUps(): Promise<FollowUp[]> {
  const localItems = await readLocal();

  if (!isSupabaseConfigured) return sortFollowUps(localItems);

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("date", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load cloud follow-ups:", error);
    return sortFollowUps(localItems);
  }

  const localById = new Map(localItems.map((item) => [String(item.id), item]));
  const cloudItems = ((data || []) as CloudFollowUpRow[]).map((row) =>
    fromCloud(row, localById.get(String(row.id ?? "")))
  );

  await writeLocal(cloudItems);
  return sortFollowUps(cloudItems);
}

export async function getFollowUpById(id: string): Promise<FollowUp | null> {
  const items = await getFollowUps();
  return items.find((item) => String(item.id) === String(id)) || null;
}

export async function addFollowUp(input: FollowUpInput): Promise<FollowUp> {
  const localItems = await readLocal();
  const localDraft = normalize(input);

  if (!isSupabaseConfigured) {
    await writeLocal([localDraft, ...localItems]);
    return localDraft;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...toCloud(input), created_at: new Date().toISOString() })
    .select("*")
    .single();

  if (error) {
    console.error("Unable to create cloud follow-up:", error);
    throw new Error(error.message || "Follow-up cloud par save nahi ho saka.");
  }

  const saved = fromCloud(data as CloudFollowUpRow, localDraft);
  await writeLocal([saved, ...localItems.filter((item) => item.id !== saved.id)]);
  return saved;
}

export async function updateFollowUp(
  id: string,
  updates: Partial<FollowUpInput>
): Promise<FollowUp | null> {
  const localItems = await readLocal();
  const existing = localItems.find((item) => String(item.id) === String(id));
  if (!existing) {
    const cloudExisting = await getFollowUpById(id);
    if (!cloudExisting) return null;
    return updateFollowUp(id, updates);
  }

  const merged = normalize({
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  });

  if (!isSupabaseConfigured || id.startsWith("followup-")) {
    const next = localItems.map((item) => (item.id === id ? merged : item));
    await writeLocal(next);
    return merged;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(toCloud(merged))
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Unable to update cloud follow-up:", error);
    throw new Error(error.message || "Follow-up cloud par update nahi ho saka.");
  }

  if (!data) return null;

  const saved = fromCloud(data as CloudFollowUpRow, merged);
  await writeLocal(localItems.map((item) => (item.id === id ? saved : item)));
  return saved;
}

export async function setFollowUpStatus(
  id: string,
  status: FollowUpStatus
): Promise<FollowUp | null> {
  return updateFollowUp(id, { status });
}

export async function deleteFollowUp(id: string): Promise<boolean> {
  const localItems = await readLocal();
  const existsLocally = localItems.some((item) => String(item.id) === String(id));

  if (isSupabaseConfigured && !id.startsWith("followup-")) {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) {
      console.error("Unable to delete cloud follow-up:", error);
      throw new Error(error.message || "Follow-up cloud se delete nahi ho saka.");
    }
  }

  const next = localItems.filter((item) => String(item.id) !== String(id));
  await writeLocal(next);
  return existsLocally || next.length !== localItems.length;
}
