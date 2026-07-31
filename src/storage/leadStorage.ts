import type { Lead, LeadInput } from "../types/lead";
import {
  createLead,
  deleteLead as deleteCloudLead,
  fetchLeadById,
  fetchLeads,
  updateLead as updateCloudLead,
} from "../services/leadsService";

// Compatibility layer for older screens/search code. Leads now live in Supabase.
export async function getLeads(): Promise<Lead[]> {
  return fetchLeads({ limit: 500 });
}

export async function getLeadById(id: string): Promise<Lead | null> {
  try {
    return await fetchLeadById(id);
  } catch {
    return null;
  }
}

export async function addLead(lead: LeadInput): Promise<Lead> {
  return createLead(lead);
}

export async function updateLead(id: string, updates: LeadInput): Promise<Lead> {
  return updateCloudLead(id, updates);
}

export async function deleteLead(id: string): Promise<boolean> {
  await deleteCloudLead(id);
  return true;
}
