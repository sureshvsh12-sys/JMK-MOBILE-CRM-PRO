import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Lead, LeadInput } from "../types/lead";

export const LEAD_STORAGE_KEY = "jmk_mobile_leads";

const LEGACY_DEMO_LEAD_IDS = new Set(["lead-1", "lead-2", "lead-3"]);

export async function getCachedLeads(): Promise<Lead[]> {
  try {
    const value = await AsyncStorage.getItem(LEAD_STORAGE_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    if (!Array.isArray(parsed)) return [];

    const leads = (parsed as Lead[]).filter(
      (lead) => lead && !LEGACY_DEMO_LEAD_IDS.has(String(lead.id || ""))
    );

    if (leads.length !== parsed.length) {
      await cacheLeads(leads);
    }

    return leads;
  } catch {
    return [];
  }
}

export async function cacheLeads(leads: Lead[]): Promise<void> {
  const productionLeads = leads.filter(
    (lead) => lead && !LEGACY_DEMO_LEAD_IDS.has(String(lead.id || ""))
  );
  await AsyncStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(productionLeads));
}

export async function upsertCachedLead(lead: Lead): Promise<void> {
  const current = await getCachedLeads();
  const index = current.findIndex((item) => item.id === lead.id);

  if (index >= 0) {
    current[index] = lead;
  } else {
    current.unshift(lead);
  }

  await cacheLeads(current);
}

export async function removeCachedLead(id: string): Promise<void> {
  const current = await getCachedLeads();
  await cacheLeads(current.filter((item) => item.id !== id));
}

export async function replaceCachedLeadId(localId: string, cloudLead: Lead): Promise<void> {
  const current = await getCachedLeads();
  const next = current.filter((item) => item.id !== localId && item.id !== cloudLead.id);
  next.unshift(cloudLead);
  await cacheLeads(next);
}

// Compatibility functions used by existing screens and global search.
export async function getLeads(): Promise<Lead[]> {
  return getCachedLeads();
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const leads = await getCachedLeads();
  return leads.find((item) => item.id === id) ?? null;
}

export async function addLead(lead: LeadInput): Promise<Lead> {
  const now = new Date().toISOString();
  const localLead: Lead = {
    ...lead,
    id: `local-lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    customerId: null,
    temperature:
      lead.stage === "Lost" || lead.priority === "Low"
        ? "Cold"
        : lead.priority === "High" || ["Negotiation", "Booking", "Registry"].includes(lead.stage)
          ? "Hot"
          : "Warm",
    rawContactId: null,
    convertedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await upsertCachedLead(localLead);
  return localLead;
}

export async function updateLead(id: string, updates: LeadInput): Promise<Lead> {
  const existing = await getLeadById(id);
  if (!existing) throw new Error("Lead offline cache me nahi mila.");

  const updated: Lead = {
    ...existing,
    ...updates,
    temperature:
      updates.stage === "Lost" || updates.priority === "Low"
        ? "Cold"
        : updates.priority === "High" || ["Negotiation", "Booking", "Registry"].includes(updates.stage)
          ? "Hot"
          : "Warm",
    updatedAt: new Date().toISOString(),
  };
  await upsertCachedLead(updated);
  return updated;
}

export async function deleteLead(id: string): Promise<boolean> {
  await removeCachedLead(id);
  return true;
}
