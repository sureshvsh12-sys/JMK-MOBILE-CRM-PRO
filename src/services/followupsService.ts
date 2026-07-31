import { isSupabaseConfigured, supabase } from "./supabase";
import {
  addFollowUp,
  deleteFollowUp,
  getFollowUpById,
  getFollowUps,
  getPendingFollowUpCount,
  setFollowUpStatus,
  syncPendingFollowUps,
  updateFollowUp,
  type FollowUp,
  type FollowUpInput,
  type FollowUpStatus,
} from "../storage/followUpStorage";

export type FollowUpFilter = "All" | FollowUpStatus;

export type FollowUpQuery = {
  search?: string;
  status?: FollowUpFilter;
  customerId?: string;
  due?: "all" | "today" | "overdue" | "upcoming";
};

function dayKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function filterFollowUps(items: FollowUp[], query: FollowUpQuery = {}): FollowUp[] {
  const search = query.search?.trim().toLowerCase() || "";
  const today = new Date();
  const todayKey = dayKey(today);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  return items.filter((item) => {
    if (query.status && query.status !== "All" && item.status !== query.status) return false;
    if (query.customerId && item.customerId !== query.customerId) return false;

    const dueTime = new Date(item.dueAt).getTime();
    if (query.due === "today" && dayKey(item.dueAt) !== todayKey) return false;
    if (query.due === "overdue" && !(item.status === "Pending" && dueTime < startOfToday)) return false;
    if (query.due === "upcoming" && !(item.status === "Pending" && dueTime >= startOfToday)) return false;

    if (!search) return true;
    return [item.customerName, item.mobile, item.subject, item.notes, item.mode, item.priority, item.assignedTo]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });
}

export async function listFollowUps(query: FollowUpQuery = {}): Promise<FollowUp[]> {
  return filterFollowUps(await getFollowUps(), query);
}

export const fetchFollowUpById = getFollowUpById;
export const createFollowUp = addFollowUp;
export const editFollowUp = updateFollowUp;
export const changeFollowUpStatus = setFollowUpStatus;
export const removeFollowUp = deleteFollowUp;
export const syncFollowUps = syncPendingFollowUps;
export const getFollowUpSyncCount = getPendingFollowUpCount;

export function subscribeToFollowUps(onChange: () => void): () => void {
  if (!isSupabaseConfigured) return () => undefined;

  const channel = supabase
    .channel(`jmk-mobile-followups-${Date.now()}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "followups" },
      () => onChange()
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export type { FollowUp, FollowUpInput, FollowUpStatus };
