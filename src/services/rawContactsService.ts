import { supabase } from "./supabase";
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

export async function fetchRawContacts(options?: {
  segment?: RawContactSegment | "all";
  search?: string;
  limit?: number;
}): Promise<RawContact[]> {
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
  return (data ?? []) as RawContact[];
}

export async function updateRawContact(
  id: string,
  updates: RawContactUpdate
): Promise<RawContact> {
  const { data, error } = await supabase
    .from("raw_contacts")
    .update({
      call_status: updates.call_status,
      remarks: updates.remarks.trim(),
      callback_date: updates.callback_date,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(RAW_CONTACT_COLUMNS)
    .single();

  if (error) throw error;
  return data as RawContact;
}

export async function convertRawContactToLead(id: string): Promise<string> {
  const { data, error } = await supabase.rpc("convert_raw_contact_to_lead", {
    p_raw_contact_id: id,
  });

  if (error) throw error;

  const leadId = data?.lead?.id;
  if (!leadId) {
    throw new Error("Lead conversion completed but Lead ID was not returned.");
  }

  return String(leadId);
}
