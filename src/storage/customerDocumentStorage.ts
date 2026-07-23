import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  CustomerDocument,
  CustomerDocumentStatus,
  CustomerDocumentType,
} from "../types/customerDocument";

const CUSTOMER_DOCUMENTS_STORAGE_KEY = "jmk_mobile_customer_documents";

function createId(): string {
  return `customer-document-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeDocument(value: Partial<CustomerDocument>): CustomerDocument {
  const now = new Date().toISOString();

  return {
    id: value.id || createId(),
    customerId: String(value.customerId || "").trim(),
    title: String(value.title || "").trim(),
    documentType: (value.documentType as CustomerDocumentType) || "Other",
    documentNumber: String(value.documentNumber || "").trim(),
    fileName: String(value.fileName || "").trim(),
    localUri: String(value.localUri || "").trim(),
    status: (value.status as CustomerDocumentStatus) || "Pending",
    notes: String(value.notes || "").trim(),
    createdAt: value.createdAt || now,
    updatedAt: now,
  };
}

async function saveDocuments(documents: CustomerDocument[]): Promise<void> {
  await AsyncStorage.setItem(
    CUSTOMER_DOCUMENTS_STORAGE_KEY,
    JSON.stringify(documents)
  );
}

export async function getCustomerDocuments(): Promise<CustomerDocument[]> {
  try {
    const storedValue = await AsyncStorage.getItem(
      CUSTOMER_DOCUMENTS_STORAGE_KEY
    );

    if (!storedValue) return [];

    const parsedValue: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) return [];

    return parsedValue.map((item) =>
      normalizeDocument(item as Partial<CustomerDocument>)
    );
  } catch (error) {
    console.error("Unable to read customer documents:", error);
    return [];
  }
}

export async function getDocumentsByCustomerId(
  customerId: string
): Promise<CustomerDocument[]> {
  const documents = await getCustomerDocuments();

  return documents
    .filter((document) => document.customerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addCustomerDocument(
  value: Partial<CustomerDocument>
): Promise<CustomerDocument> {
  const documents = await getCustomerDocuments();
  const document = normalizeDocument(value);
  await saveDocuments([document, ...documents]);
  return document;
}

export async function updateCustomerDocument(
  id: string,
  updates: Partial<CustomerDocument>
): Promise<CustomerDocument | null> {
  const documents = await getCustomerDocuments();
  let updatedDocument: CustomerDocument | null = null;

  const nextDocuments = documents.map((document) => {
    if (document.id !== id) return document;

    updatedDocument = normalizeDocument({
      ...document,
      ...updates,
      id: document.id,
      customerId: document.customerId,
      createdAt: document.createdAt,
    });

    return updatedDocument;
  });

  if (!updatedDocument) return null;

  await saveDocuments(nextDocuments);
  return updatedDocument;
}

export async function deleteCustomerDocument(id: string): Promise<boolean> {
  const documents = await getCustomerDocuments();
  const nextDocuments = documents.filter((document) => document.id !== id);

  if (nextDocuments.length === documents.length) return false;

  await saveDocuments(nextDocuments);
  return true;
}
