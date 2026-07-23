export type CustomerDocumentType =
  | "Aadhaar"
  | "PAN"
  | "Photo"
  | "Bank Statement"
  | "Salary Slip"
  | "Agreement"
  | "Registry"
  | "Other";

export type CustomerDocumentStatus = "Pending" | "Verified" | "Rejected";

export type CustomerDocument = {
  id: string;
  customerId: string;
  title: string;
  documentType: CustomerDocumentType;
  documentNumber: string;
  fileName: string;
  localUri: string;
  status: CustomerDocumentStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export const CUSTOMER_DOCUMENT_TYPES: CustomerDocumentType[] = [
  "Aadhaar",
  "PAN",
  "Photo",
  "Bank Statement",
  "Salary Slip",
  "Agreement",
  "Registry",
  "Other",
];

export const CUSTOMER_DOCUMENT_STATUSES: CustomerDocumentStatus[] = [
  "Pending",
  "Verified",
  "Rejected",
];
