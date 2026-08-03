import { supabase, isSupabaseConfigured } from "./supabase";
import {
  cacheRawContacts,
  getCachedRawContacts,
  markCachedRawContactConverted,
  upsertCachedRawContact,
} from "../storage/rawContactStorage";
import type {
  RawContact,
  RawContactSegment,
  RawContactUpdate,
} from "../types/rawContact";

const RAW_CONTACT_COLUMNS = [
  "id",
  "segment",
  "full_name",
  "mobile",
  "email",
  "city",
  "district",
  "source",
  "call_status",
  "remarks",
  "callback_date",
  "assigned_to",
  "converted_to_lead",
  "lead_id",
  "created_at",
  "updated_at",
].join(",");

function filterCachedContacts(
  contacts: RawContact[],
  options?: {
    segment?: RawContactSegment | "all";
    search?: string;
    limit?: number;
  }
): RawContact[] {
  const search = options?.search?.trim().toLowerCase();
  const filtered = contacts.filter((contact) => {
    if (options?.segment && options.segment !== "all" && contact.segment !== options.segment) {
      return false;
    }

    if (!search) return true;

    return [
      contact.full_name,
      contact.mobile,
      contact.city,
      contact.district,
      contact.call_status,
    ].some((value) => String(value ?? "").toLowerCase().includes(search));
  });

  return filtered
    .sort((a, b) => {
      const aCallback = a.callback_date ? new Date(a.callback_date).getTime() : Number.MAX_SAFE_INTEGER;
      const bCallback = b.callback_date ? new Date(b.callback_date).getTime() : Number.MAX_SAFE_INTEGER;
      if (aCallback !== bCallback) return aCallback - bCallback;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, options?.limit ?? 500);
}

export async function fetchRawContacts(options?: {
  segment?: RawContactSegment | "all";
  search?: string;
  limit?: number;
}): Promise<RawContact[]> {
  if (!isSupabaseConfigured) {
    return filterCachedContacts(await getCachedRawContacts(), options);
  }

  try {
    let query = supabase
      .from("raw_contacts")
      .select(RAW_CONTACT_COLUMNS)
      .order("callback_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(options?.limit ?? 500);

    if (options?.segment && options.segment !== "all") {
      query = query.eq("segment", options.segment);
    }

    const cleanSearch = options?.search?.trim();
    if (cleanSearch) {
      const escaped = cleanSearch.replace(/[%_,()]/g, " ").trim();
      query = query.or(
        `full_name.ilike.%${escaped}%,mobile.ilike.%${escaped}%,city.ilike.%${escaped}%,district.ilike.%${escaped}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    const contacts = (data ?? []) as unknown as RawContact[];
    const cached = await getCachedRawContacts();
    const merged = new Map(cached.map((item) => [item.id, item]));
    contacts.forEach((item) => merged.set(item.id, item));
    await cacheRawContacts(Array.from(merged.values()));

    return contacts;
  } catch (error) {
    const cached = filterCachedContacts(await getCachedRawContacts(), options);
    if (cached.length > 0) return cached;
    throw error;
  }
}

export async function updateRawContact(
  id: string,
  updates: RawContactUpdate
): Promise<RawContact> {
  const cached = await getCachedRawContacts();
  const existing = cached.find((item) => item.id === id);
  const now = new Date().toISOString();

  if (!isSupabaseConfigured) {
    if (!existing) throw new Error("Raw Contact offline cache me nahi mila.");
    const localUpdated: RawContact = {
      ...existing,
      call_status: updates.call_status,
      remarks: updates.remarks.trim(),
      callback_date: updates.callback_date,
      updated_at: now,
    };
    await upsertCachedRawContact(localUpdated);
    return localUpdated;
  }

  try {
    const { data, error } = await supabase
      .from("raw_contacts")
      .update({
        call_status: updates.call_status,
        remarks: updates.remarks.trim(),
        callback_date: updates.callback_date,
        updated_at: now,
      })
      .eq("id", id)
      .select(RAW_CONTACT_COLUMNS)
      .single();

    if (error) throw error;
    const updated = data as unknown as RawContact;
    await upsertCachedRawContact(updated);
    return updated;
  } catch (error) {
    if (!existing) throw error;

    const localUpdated: RawContact = {
      ...existing,
      call_status: updates.call_status,
      remarks: updates.remarks.trim(),
      callback_date: updates.callback_date,
      updated_at: now,
    };
    await upsertCachedRawContact(localUpdated);
    return localUpdated;
  }
}

export async function convertRawContactToLead(id: string): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error("Lead conversion ke liye Supabase connection required hai.");
  }

  const { data, error } = await supabase.rpc("convert_raw_contact_to_lead", {
    p_raw_contact_id: id,
  });

  if (error) throw error;

  const leadId = data?.lead?.id;
  if (!leadId) {
    throw new Error("Lead conversion completed but Lead ID was not returned.");
  }

  const normalizedLeadId = String(leadId);
  await markCachedRawContactConverted(id, normalizedLeadId);
  return normalizedLeadId;
}
