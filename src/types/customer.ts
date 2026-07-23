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
  createdAt: string;
  updatedAt: string;
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
