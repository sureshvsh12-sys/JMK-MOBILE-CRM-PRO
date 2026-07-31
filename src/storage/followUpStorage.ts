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
const PENDING_KEY = "jmk_mobile_followups_pending_operations";
const LOCAL_ID_PREFIX = "local-followup-";
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

type PendingOperation =
  | { id: string; type: "create"; followUp: FollowUp }
  | { id: string; type: "update"; followUp: FollowUp }
  | { id: string; type: "delete"; followUpId: string };

function createId(): string {
  return `${LOCAL_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function operationId(): string {
  return `followup-operation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanMobile(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeStatus(value: unknown): FollowUpStatus {
  const status = String(value ?? "").trim().toLowerCase();
  if (status === "completed" || status === "done") return "Completed";
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
    subject: String(value.subject || "Follow-up").trim() || "Follow-up",
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
    assignedTo: local?.assignedTo || "Admin",
    createdAt,
    updatedAt: row.updated_at || local?.updatedAt || createdAt,
  });
}

function toCloud(input: FollowUpInput | Partial<FollowUp>) {
  const { date, time } = localDateParts(input.dueAt || new Date().toISOString());
  return {
    customer_id: input.customerId || null,
    customer: String(input.customerName || "").trim(),
    mobile: cleanMobile(input.mobile),
    property: String(input.subject || "Follow-up").trim() || "Follow-up",
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
    const parsed: unknown = raw ? JSON.parse(raw) : [];
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
  const unique = new Map<string, FollowUp>();
  items.forEach((item) => {
    const normalized = normalize(item);
    if (!LEGACY_DEMO_IDS.has(normalized.id)) unique.set(normalized.id, normalized);
  });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...unique.values()]));
}

async function readPending(): Promise<PendingOperation[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PendingOperation[]) : [];
  } catch {
    return [];
  }
}

async function writePending(items: PendingOperation[]): Promise<void> {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(items));
}

async function enqueue(operation: PendingOperation): Promise<void> {
  const current = await readPending();
  let next = current;

  if (operation.type === "delete") {
    next = current.filter((item) => {
      if (item.type === "delete") return item.followUpId !== operation.followUpId;
      return item.followUp.id !== operation.followUpId;
    });
  } else {
    next = current.filter((item) => {
      if (item.type === "delete") return true;
      return item.followUp.id !== operation.followUp.id;
    });
  }

  await writePending([...next, operation]);
}

function sortFollowUps(items: FollowUp[]): FollowUp[] {
  return [...items].sort((a, b) => {
    if (a.status === "Pending" && b.status !== "Pending") return -1;
    if (a.status !== "Pending" && b.status === "Pending") return 1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

async function replaceLocalId(localId: string, cloudItem: FollowUp): Promise<void> {
  const localItems = await readLocal();
  await writeLocal(localItems.map((item) => (item.id === localId ? cloudItem : item)));
}

export async function syncPendingFollowUps(): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  const pending = await readPending();
  if (pending.length === 0) return 0;

  const remaining: PendingOperation[] = [];
  let synced = 0;

  for (const operation of pending) {
    try {
      if (operation.type === "delete") {
        if (!operation.followUpId.startsWith(LOCAL_ID_PREFIX)) {
          const { error } = await supabase.from(TABLE).delete().eq("id", operation.followUpId);
          if (error) throw error;
        }
        synced += 1;
        continue;
      }

      if (operation.type === "create" || operation.followUp.id.startsWith(LOCAL_ID_PREFIX)) {
        const { data, error } = await supabase
          .from(TABLE)
          .insert({ ...toCloud(operation.followUp), created_at: operation.followUp.createdAt })
          .select("*")
          .single();
        if (error) throw error;
        await replaceLocalId(operation.followUp.id, fromCloud(data as CloudFollowUpRow, operation.followUp));
        synced += 1;
        continue;
      }

      const { data, error } = await supabase
        .from(TABLE)
        .update(toCloud(operation.followUp))
        .eq("id", operation.followUp.id)
        .select("*")
        .single();
      if (error) throw error;
      await replaceLocalId(operation.followUp.id, fromCloud(data as CloudFollowUpRow, operation.followUp));
      synced += 1;
    } catch (error) {
      console.error("Unable to sync pending follow-up operation:", error);
      remaining.push(operation);
    }
  }

  await writePending(remaining);
  return synced;
}

export async function getPendingFollowUpCount(): Promise<number> {
  return (await readPending()).length;
}

export async function getFollowUps(): Promise<FollowUp[]> {
  const localItems = await readLocal();
  if (!isSupabaseConfigured) return sortFollowUps(localItems);

  try {
    await syncPendingFollowUps();
    const refreshedLocal = await readLocal();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("date", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;

    const localById = new Map(refreshedLocal.map((item) => [String(item.id), item]));
    const cloudItems = ((data || []) as CloudFollowUpRow[]).map((row) =>
      fromCloud(row, localById.get(String(row.id ?? "")))
    );
    const localDrafts = refreshedLocal.filter((item) => item.id.startsWith(LOCAL_ID_PREFIX));
    const merged = [...localDrafts, ...cloudItems];
    await writeLocal(merged);
    return sortFollowUps(merged);
  } catch (error) {
    console.error("Unable to load cloud follow-ups:", error);
    return sortFollowUps(await readLocal());
  }
}

export async function getFollowUpById(id: string): Promise<FollowUp | null> {
  const local = (await readLocal()).find((item) => item.id === id);
  if (local) return local;
  const items = await getFollowUps();
  return items.find((item) => item.id === id) || null;
}

export async function addFollowUp(input: FollowUpInput): Promise<FollowUp> {
  const localItems = await readLocal();
  const localDraft = normalize({ ...input, id: createId() });
  await writeLocal([localDraft, ...localItems]);

  if (!isSupabaseConfigured) {
    await enqueue({ id: operationId(), type: "create", followUp: localDraft });
    return localDraft;
  }

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...toCloud(input), created_at: localDraft.createdAt })
      .select("*")
      .single();
    if (error) throw error;
    const saved = fromCloud(data as CloudFollowUpRow, localDraft);
    await replaceLocalId(localDraft.id, saved);
    return saved;
  } catch (error) {
    console.error("Unable to create cloud follow-up:", error);
    await enqueue({ id: operationId(), type: "create", followUp: localDraft });
    return localDraft;
  }
}

export async function updateFollowUp(
  id: string,
  updates: Partial<FollowUpInput>
): Promise<FollowUp | null> {
  const localItems = await readLocal();
  const existing = localItems.find((item) => item.id === id) || (await getFollowUpById(id));
  if (!existing) return null;

  const merged = normalize({
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  });
  await writeLocal(localItems.some((item) => item.id === id)
    ? localItems.map((item) => (item.id === id ? merged : item))
    : [merged, ...localItems]);

  if (!isSupabaseConfigured || id.startsWith(LOCAL_ID_PREFIX)) {
    await enqueue({ id: operationId(), type: id.startsWith(LOCAL_ID_PREFIX) ? "create" : "update", followUp: merged });
    return merged;
  }

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .update(toCloud(merged))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    const saved = fromCloud(data as CloudFollowUpRow, merged);
    await replaceLocalId(id, saved);
    return saved;
  } catch (error) {
    console.error("Unable to update cloud follow-up:", error);
    await enqueue({ id: operationId(), type: "update", followUp: merged });
    return merged;
  }
}

export async function setFollowUpStatus(id: string, status: FollowUpStatus): Promise<FollowUp | null> {
  return updateFollowUp(id, { status });
}

export async function deleteFollowUp(id: string): Promise<boolean> {
  const localItems = await readLocal();
  const existsLocally = localItems.some((item) => item.id === id);
  await writeLocal(localItems.filter((item) => item.id !== id));

  if (id.startsWith(LOCAL_ID_PREFIX)) {
    const pending = await readPending();
    await writePending(pending.filter((item) => item.type === "delete" || item.followUp.id !== id));
    return existsLocally;
  }

  if (!isSupabaseConfigured) {
    await enqueue({ id: operationId(), type: "delete", followUpId: id });
    return existsLocally;
  }

  try {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  } catch (error) {
    console.error("Unable to delete cloud follow-up:", error);
    await enqueue({ id: operationId(), type: "delete", followUpId: id });
  }

  return existsLocally;
}
