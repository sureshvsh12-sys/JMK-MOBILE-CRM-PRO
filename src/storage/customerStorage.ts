import { supabase } from "../services/supabase";
import type {
  Customer,
  CustomerInput,
  CustomerSegment,
  CustomerStatus,
} from "../types/customer";

const CUSTOMER_COLUMNS = [
  "id",
  "name",
  "full_name",
  "mobile",
  "alternate_mobile",
  "email",
  "segment",
  "status",
  "city",
  "location",
  "address",
  "occupation",
  "source",
  "assigned_to",
  "notes",
  "lead_id",
  "raw_contact_id",
  "created_at",
  "updated_at",
].join(",");

type CustomerRow = Record<string, unknown>;

function normalizeSegment(value: unknown): CustomerSegment {
  const segment = String(value || "assets").toLowerCase();
  if (segment === "finance") return "Finance";
  if (segment === "solar") return "Solar";
  return "Assets";
}

function normalizeStatus(value: unknown): CustomerStatus {
  const status = String(value || "Active").toLowerCase();
  if (status === "inactive") return "Inactive";
  if (status === "prospect") return "Prospect";
  return "Active";
}

function toDatabaseSegment(segment: CustomerSegment): string {
  return segment.toLowerCase();
}

function mapCustomer(row: CustomerRow): Customer {
  return {
    id: String(row.id || ""),
    name: String(row.full_name || row.name || ""),
    mobile: String(row.mobile || ""),
    alternateMobile: String(row.alternate_mobile || ""),
    email: String(row.email || ""),
    segment: normalizeSegment(row.segment),
    status: normalizeStatus(row.status),
    city: String(row.city || row.location || ""),
    address: String(row.address || ""),
    occupation: String(row.occupation || ""),
    source: String(row.source || "Mobile App"),
    assignedTo: String(row.assigned_to || "Admin"),
    notes: String(row.notes || ""),
    leadId: row.lead_id ? String(row.lead_id) : null,
    rawContactId: row.raw_contact_id ? String(row.raw_contact_id) : null,
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || row.created_at || ""),
  };
}

function toPayload(value: CustomerInput) {
  const name = value.name.trim();
  const city = value.city.trim();

  return {
    name,
    full_name: name,
    mobile: value.mobile.replace(/\D/g, ""),
    alternate_mobile: value.alternateMobile.replace(/\D/g, "") || null,
    email: value.email.trim().toLowerCase() || null,
    segment: toDatabaseSegment(value.segment),
    status: value.status,
    city: city || null,
    location: city || null,
    address: value.address.trim() || null,
    occupation: value.occupation.trim() || null,
    source: value.source.trim() || "Mobile App",
    assigned_to: value.assignedTo.trim() || "Admin",
    notes: value.notes.trim() || null,
    updated_at: new Date().toISOString(),
  };
}

export async function getCustomers(options?: {
  segment?: CustomerSegment | "All";
  status?: CustomerStatus | "All";
  search?: string;
  limit?: number;
}): Promise<Customer[]> {
  let query = supabase
    .from("customers")
    .select(CUSTOMER_COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(options?.limit ?? 500);

  if (options?.segment && options.segment !== "All") {
    query = query.eq("segment", toDatabaseSegment(options.segment));
  }

  if (options?.status && options.status !== "All") {
    query = query.eq("status", options.status);
  }

  const search = options?.search?.trim().replace(/[%_,()]/g, " ");
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,name.ilike.%${search}%,mobile.ilike.%${search}%,city.ilike.%${search}%,location.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapCustomer(row as CustomerRow));
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select(CUSTOMER_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapCustomer(data as CustomerRow) : null;
}

export async function addCustomer(value: CustomerInput): Promise<Customer> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("customers")
    .insert({ ...toPayload(value), created_at: now })
    .select(CUSTOMER_COLUMNS)
    .single();

  if (error) throw error;
  return mapCustomer(data as CustomerRow);
}

export async function updateCustomer(
  id: string,
  updates: CustomerInput
): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .update(toPayload(updates))
    .eq("id", id)
    .select(CUSTOMER_COLUMNS)
    .single();

  if (error) throw error;
  return mapCustomer(data as CustomerRow);
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export function subscribeToCustomers(onChange: () => void) {
  const channel = supabase
    .channel(`mobile-customers-${Date.now()}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "customers" },
      onChange
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
