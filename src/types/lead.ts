export type LeadStage =
  | "New Lead"
  | "Contacted"
  | "Site Visit"
  | "Negotiation"
  | "Booking"
  | "Registry"
  | "Completed"
  | "Lost";

export type LeadPriority = "High" | "Medium" | "Low";
export type LeadTemperature = "Hot" | "Warm" | "Cold";
export type LeadSegment = "finance" | "assets" | "solar";

export type Lead = {
  id: string;
  customerId: string | null;
  customer: string;
  mobile: string;
  email: string;
  segment: LeadSegment;
  source: string;
  property: string;
  location: string;
  budget: string;
  value: number;
  stage: LeadStage;
  priority: LeadPriority;
  temperature: LeadTemperature;
  assignedTo: string;
  nextFollowup: string;
  notes: string;
  rawContactId: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadInput = Omit<
  Lead,
  | "id"
  | "customerId"
  | "temperature"
  | "rawContactId"
  | "convertedAt"
  | "createdAt"
  | "updatedAt"
>;

export const LEAD_STAGES: LeadStage[] = [
  "New Lead",
  "Contacted",
  "Site Visit",
  "Negotiation",
  "Booking",
  "Registry",
  "Completed",
  "Lost",
];

export const LEAD_PRIORITIES: LeadPriority[] = ["High", "Medium", "Low"];
export const LEAD_TEMPERATURES: LeadTemperature[] = ["Hot", "Warm", "Cold"];
export const LEAD_SEGMENTS: LeadSegment[] = ["finance", "assets", "solar"];

export const LEAD_SEGMENT_LABELS: Record<LeadSegment, string> = {
  finance: "Finance",
  assets: "Assets",
  solar: "Solar",
};
