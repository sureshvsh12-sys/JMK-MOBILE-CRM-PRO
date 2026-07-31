export type CustomerSegment = "Finance" | "Assets" | "Solar";
export type CustomerStatus = "Active" | "Prospect" | "Inactive";

export type Customer = {
  id: string;
  name: string;
  mobile: string;
  alternateMobile: string;
  email: string;
  segment: CustomerSegment;
  status: CustomerStatus;
  city: string;
  address: string;
  occupation: string;
  source: string;
  assignedTo: string;
  notes: string;
  leadId: string | null;
  rawContactId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerInput = Omit<
  Customer,
  "id" | "leadId" | "rawContactId" | "createdAt" | "updatedAt"
>;

export type Customer360Summary = {
  followUps: number;
  quotations: number;
  payments: number;
  calls: number;
};

export const CUSTOMER_SEGMENTS: CustomerSegment[] = [
  "Finance",
  "Assets",
  "Solar",
];

export const CUSTOMER_STATUSES: CustomerStatus[] = [
  "Active",
  "Prospect",
  "Inactive",
];
