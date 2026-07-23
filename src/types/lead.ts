export type LeadStage =
  | "New Lead"
  | "Contacted"
  | "Site Visit"
  | "Negotiation"
  | "Booking"
  | "Registry"
  | "Completed"
  | "Lost";

export type LeadPriority =
  | "High"
  | "Medium"
  | "Low";

export type LeadTemperature =
  | "Hot"
  | "Warm"
  | "Cold";

export type LeadSegment =
  | "Finance"
  | "Assets"
  | "Solar";

export type Lead = {
  id: string;
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
  createdAt: string;
  updatedAt: string;
};

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

export const LEAD_PRIORITIES: LeadPriority[] = [
  "High",
  "Medium",
  "Low",
];

export const LEAD_TEMPERATURES: LeadTemperature[] =
  ["Hot", "Warm", "Cold"];

export const LEAD_SEGMENTS: LeadSegment[] = [
  "Finance",
  "Assets",
  "Solar",
];