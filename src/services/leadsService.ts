import { isSupabaseConfigured, supabase } from "./supabase";
import {
  cacheLeads,
  getCachedLeads,
  removeCachedLead,
  upsertCachedLead,
} from "../storage/leadStorage";
import type {
  Lead,
  LeadInput,
  LeadPriority,
  LeadSegment,
  LeadStage,
  LeadTemperature,
} from "../types/lead";

const LEAD_COLUMNS = [
  "id",
  "customer_id",
  "customer",
  "mobile",
  "email",
  "source",
  "property",
  "location",
  "budget",
  "value",
  "stage",
  "priority",
  "assigned_to",
  "next_followup",
  "notes",
  "segment",
  "raw_contact_id",
  "converted_at",
  "created_at",
  "updated_at",
].join(",");

type LeadRow = Record<string, unknown>;

function normalizeSegment(value: unknown): LeadSegment {
  const segment = String(value || "assets").toLowerCase();
  if (segment === "finance" || segment === "solar") return segment;
  return "assets";
}

function normalizePriority(value: unknown): LeadPriority {
  if (value === "High" || value === "Low") return value;
  return "Medium";
}

function normalizeStage(value: unknown): LeadStage {
  const stages: LeadStage[] = [
    "New Lead",
    "Contacted",
    "Site Visit",
    "Negotiation",
    "Booking",
    "Registry",
    "Completed",
    "Lost",
  ];
  return stages.includes(value as LeadStage) ? (value as LeadStage) : "New Lead";
}

function deriveTemperature(priority: LeadPriority, stage: LeadStage): LeadTemperature {
  if (stage === "Lost") return "Cold";
  if (priority === "High" || ["Negotiation", "Booking", "Registry"].includes(stage)) {
    return "Hot";
  }
  if (priority === "Low") return "Cold";
  return "Warm";
}

function mapLead(row: LeadRow): Lead {
  const priority = normalizePriority(row.priority);
  const stage = normalizeStage(row.stage);

  return {
    id: String(row.id || ""),
    customerId: row.customer_id ? String(row.customer_id) : null,
    customer: String(row.customer || ""),
    mobile: String(row.mobile || ""),
    email: String(row.email || ""),
    segment: normalizeSegment(row.segment),
    source: String(row.source || ""),
    property: String(row.property || ""),
    location: String(row.location || ""),
    budget: String(row.budget || ""),
    value: Number(row.value || 0),
    stage,
    priority,
    temperature: deriveTemperature(priority, stage),
    assignedTo: String(row.assigned_to || "Admin"),
    nextFollowup: String(row.next_followup || ""),
    notes: String(row.notes || ""),
    rawContactId: row.raw_contact_id ? String(row.raw_contact_id) : null,
    convertedAt: row.converted_at ? String(row.converted_at) : null,
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
  };
}

function toPayload(input: LeadInput) {
  return {
    customer: input.customer.trim(),
    mobile: input.mobile.replace(/\D/g, ""),
    email: input.email.trim().toLowerCase(),
    segment: input.segment,
    source: input.source.trim() || "Mobile App",
    property: input.property.trim(),
    location: input.location.trim(),
    budget: input.budget.trim(),
    value: Number(input.value || 0),
    stage: input.stage,
    priority: input.priority,
    assigned_to: input.assignedTo.trim() || "Admin",
    next_followup: input.nextFollowup || null,
    notes: input.notes.trim(),
    stage_updated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function filterCachedLeads(
  leads: Lead[],
  options?: {
    segment?: LeadSegment | "all";
    stage?: LeadStage | "all";
    search?: string;
    limit?: number;
  }
): Lead[] {
  const search = options?.search?.trim().toLowerCase();
  return leads
    .filter((lead) => {
      if (options?.segment && options.segment !== "all" && lead.segment !== options.segment) return false;
      if (options?.stage && options.stage !== "all" && lead.stage !== options.stage) return false;
      if (!search) return true;
      return [lead.customer, lead.mobile, lead.property, lead.location, lead.source].some((value) =>
        String(value ?? "").toLowerCase().includes(search)
      );
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, options?.limit ?? 500);
}

function createOfflineLead(input: LeadInput): Lead {
  const now = new Date().toISOString();
  const priority = normalizePriority(input.priority);
  const stage = normalizeStage(input.stage);
  return {
    ...input,
    id: `local-lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    customerId: null,
    mobile: input.mobile.replace(/\D/g, ""),
    email: input.email.trim().toLowerCase(),
    stage,
    priority,
    temperature: deriveTemperature(priority, stage),
    rawContactId: null,
    convertedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function fetchLeads(options?: {
  segment?: LeadSegment | "all";
  stage?: LeadStage | "all";
  search?: string;
  limit?: number;
}): Promise<Lead[]> {
  if (!isSupabaseConfigured) {
    return filterCachedLeads(await getCachedLeads(), options);
  }

  try {
    let query = supabase
      .from("leads")
      .select(LEAD_COLUMNS)
      .order("updated_at", { ascending: false })
      .limit(options?.limit ?? 500);

    if (options?.segment && options.segment !== "all") query = query.eq("segment", options.segment);
    if (options?.stage && options.stage !== "all") query = query.eq("stage", options.stage);

    const search = options?.search?.trim().replace(/[%_,()]/g, " ");
    if (search) {
      query = query.or(
        `customer.ilike.%${search}%,mobile.ilike.%${search}%,property.ilike.%${search}%,location.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    const cloudLeads = (data ?? []).map((row) => mapLead(row as LeadRow));
    const cached = await getCachedLeads();
    const pendingLocal = cached.filter((item) => item.id.startsWith("local-lead-"));
    const merged = [...pendingLocal, ...cloudLeads.filter((item) => !pendingLocal.some((local) => local.id === item.id))];
    await cacheLeads(merged);
    return filterCachedLeads(merged, options);
  } catch (error) {
    const cached = filterCachedLeads(await getCachedLeads(), options);
    if (cached.length > 0) return cached;
    throw error;
  }
}

export async function fetchLeadById(id: string): Promise<Lead> {
  const cached = (await getCachedLeads()).find((item) => item.id === id);
  if (!isSupabaseConfigured || id.startsWith("local-lead-")) {
    if (!cached) throw new Error("Lead offline cache me nahi mila.");
    return cached;
  }

  try {
    const { data, error } = await supabase.from("leads").select(LEAD_COLUMNS).eq("id", id).single();
    if (error) throw error;
    const lead = mapLead(data as LeadRow);
    await upsertCachedLead(lead);
    return lead;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

export async function createLead(input: LeadInput): Promise<Lead> {
  if (!isSupabaseConfigured) {
    const localLead = createOfflineLead(input);
    await upsertCachedLead(localLead);
    return localLead;
  }

  try {
    const { data, error } = await supabase
      .from("leads")
      .insert({ ...toPayload(input), created_at: new Date().toISOString() })
      .select(LEAD_COLUMNS)
      .single();
    if (error) throw error;
    const lead = mapLead(data as LeadRow);
    await upsertCachedLead(lead);
    return lead;
  } catch {
    const localLead = createOfflineLead(input);
    await upsertCachedLead(localLead);
    return localLead;
  }
}

export async function updateLead(id: string, input: LeadInput): Promise<Lead> {
  const cached = (await getCachedLeads()).find((item) => item.id === id);
  if (!isSupabaseConfigured || id.startsWith("local-lead-")) {
    if (!cached) throw new Error("Lead offline cache me nahi mila.");
    const priority = normalizePriority(input.priority);
    const stage = normalizeStage(input.stage);
    const updated: Lead = {
      ...cached,
      ...input,
      mobile: input.mobile.replace(/\D/g, ""),
      email: input.email.trim().toLowerCase(),
      stage,
      priority,
      temperature: deriveTemperature(priority, stage),
      updatedAt: new Date().toISOString(),
    };
    await upsertCachedLead(updated);
    return updated;
  }

  try {
    const { data, error } = await supabase
      .from("leads")
      .update(toPayload(input))
      .eq("id", id)
      .select(LEAD_COLUMNS)
      .single();
    if (error) throw error;
    const updated = mapLead(data as LeadRow);
    await upsertCachedLead(updated);
    return updated;
  } catch (error) {
    if (!cached) throw error;
    const priority = normalizePriority(input.priority);
    const stage = normalizeStage(input.stage);
    const updated: Lead = { ...cached, ...input, stage, priority, temperature: deriveTemperature(priority, stage), updatedAt: new Date().toISOString() };
    await upsertCachedLead(updated);
    return updated;
  }
}

export async function updateLeadStage(id: string, stage: LeadStage): Promise<Lead> {
  const cached = (await getCachedLeads()).find((item) => item.id === id);
  if (!isSupabaseConfigured || id.startsWith("local-lead-")) {
    if (!cached) throw new Error("Lead offline cache me nahi mila.");
    const updated: Lead = {
      ...cached,
      stage,
      temperature: deriveTemperature(cached.priority, stage),
      updatedAt: new Date().toISOString(),
    };
    await upsertCachedLead(updated);
    return updated;
  }

  try {
    const { data, error } = await supabase
      .from("leads")
      .update({ stage, stage_updated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(LEAD_COLUMNS)
      .single();
    if (error) throw error;
    const updated = mapLead(data as LeadRow);
    await upsertCachedLead(updated);
    return updated;
  } catch (error) {
    if (!cached) throw error;
    const updated: Lead = { ...cached, stage, temperature: deriveTemperature(cached.priority, stage), updatedAt: new Date().toISOString() };
    await upsertCachedLead(updated);
    return updated;
  }
}

export async function deleteLead(id: string): Promise<void> {
  if (!isSupabaseConfigured || id.startsWith("local-lead-")) {
    await removeCachedLead(id);
    return;
  }

  try {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) throw error;
    await removeCachedLead(id);
  } catch (error) {
    const cached = (await getCachedLeads()).some((item) => item.id === id);
    if (!cached) throw error;
    await removeCachedLead(id);
  }
}

export async function convertLeadToCustomer(id: string): Promise<string> {
  if (!isSupabaseConfigured || id.startsWith("local-lead-")) {
    throw new Error("Customer conversion ke liye Supabase connection required hai.");
  }
  const lead = await fetchLeadById(id);
  if (lead.customerId) return lead.customerId;
  if (lead.stage !== "Completed") {
    throw new Error("Only a Completed Lead can be converted to Customer.");
  }

  const now = new Date().toISOString();
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      name: lead.customer,
      full_name: lead.customer,
      mobile: lead.mobile,
      email: lead.email,
      location: lead.location,
      address: lead.location,
      requirement: lead.property,
      status: "Active",
      segment: lead.segment,
      source: lead.source || "Lead Conversion",
      notes: lead.notes,
      lead_id: lead.id,
      raw_contact_id: lead.rawContactId,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();
  if (customerError) throw customerError;

  const customerId = String(customer.id);
  const { error: leadError } = await supabase
    .from("leads")
    .update({ customer_id: customerId, converted_at: now, updated_at: now })
    .eq("id", id);
  if (leadError) {
    await supabase.from("customers").delete().eq("id", customerId);
    throw leadError;
  }

  return customerId;
}
