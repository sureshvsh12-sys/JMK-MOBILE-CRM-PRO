import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    Lead,
    LeadPriority,
    LeadSegment,
    LeadStage,
    LeadTemperature,
} from "../types/lead";

const LEADS_STORAGE_KEY =
  "jmk_mobile_leads";

const LEGACY_DEMO_IDS = new Set(["lead-1", "lead-2", "lead-3"]);

function createId() {
  return `lead-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function normalizeLead(
  lead: Partial<Lead>
): Lead {
  const now = new Date().toISOString();

  return {
    id: lead.id || createId(),
    customer: String(
      lead.customer || ""
    ).trim(),
    mobile: String(
      lead.mobile || ""
    ).replace(/\D/g, ""),
    email: String(lead.email || "")
      .trim()
      .toLowerCase(),
    segment:
      (lead.segment as LeadSegment) ||
      "Assets",
    source:
      String(lead.source || "").trim() ||
      "Mobile App",
    property: String(
      lead.property || ""
    ).trim(),
    location: String(
      lead.location || ""
    ).trim(),
    budget: String(
      lead.budget || ""
    ).trim(),
    value: Number(lead.value || 0),
    stage:
      (lead.stage as LeadStage) ||
      "New Lead",
    priority:
      (lead.priority as LeadPriority) ||
      "Medium",
    temperature:
      (lead.temperature as LeadTemperature) ||
      "Warm",
    assignedTo:
      String(
        lead.assignedTo || ""
      ).trim() || "Admin",
    nextFollowup: String(
      lead.nextFollowup || ""
    ),
    notes: String(lead.notes || "").trim(),
    createdAt: lead.createdAt || now,
    updatedAt: now,
  };
}

async function saveLeads(
  leads: Lead[]
): Promise<void> {
  await AsyncStorage.setItem(
    LEADS_STORAGE_KEY,
    JSON.stringify(leads)
  );
}

export async function getLeads(): Promise<
  Lead[]
> {
  try {
    const storedValue =
      await AsyncStorage.getItem(
        LEADS_STORAGE_KEY
      );

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(
      storedValue
    );

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    const leads = parsedValue
      .map(normalizeLead)
      .filter((lead) => !LEGACY_DEMO_IDS.has(lead.id));

    if (leads.length !== parsedValue.length) {
      await saveLeads(leads);
    }

    return leads;
  } catch (error) {
    console.error(
      "Unable to read mobile leads:",
      error
    );

    return [];
  }
}

export async function getLeadById(
  id: string
): Promise<Lead | null> {
  const leads = await getLeads();

  return (
    leads.find(
      (lead) =>
        String(lead.id) === String(id)
    ) || null
  );
}

export async function addLead(
  lead: Partial<Lead>
): Promise<Lead> {
  const leads = await getLeads();
  const newLead = normalizeLead(lead);

  await saveLeads([newLead, ...leads]);

  return newLead;
}

export async function updateLead(
  id: string,
  updates: Partial<Lead>
): Promise<Lead | null> {
  const leads = await getLeads();
  let updatedLead: Lead | null = null;

  const nextLeads = leads.map((lead) => {
    if (
      String(lead.id) !== String(id)
    ) {
      return lead;
    }

    updatedLead = normalizeLead({
      ...lead,
      ...updates,
      id: lead.id,
      createdAt: lead.createdAt,
    });

    return updatedLead;
  });

  if (!updatedLead) {
    return null;
  }

  await saveLeads(nextLeads);

  return updatedLead;
}

export async function deleteLead(
  id: string
): Promise<boolean> {
  const leads = await getLeads();

  const nextLeads = leads.filter(
    (lead) =>
      String(lead.id) !== String(id)
  );

  if (
    nextLeads.length === leads.length
  ) {
    return false;
  }

  await saveLeads(nextLeads);

  return true;
}