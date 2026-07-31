import AsyncStorage from "@react-native-async-storage/async-storage";

import type { RawContact } from "../types/rawContact";

export const RAW_CONTACT_STORAGE_KEY = "jmk_mobile_raw_contacts";

export async function getCachedRawContacts(): Promise<RawContact[]> {
  try {
    const value = await AsyncStorage.getItem(RAW_CONTACT_STORAGE_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? (parsed as RawContact[]) : [];
  } catch {
    return [];
  }
}

export async function cacheRawContacts(contacts: RawContact[]): Promise<void> {
  await AsyncStorage.setItem(RAW_CONTACT_STORAGE_KEY, JSON.stringify(contacts));
}

export async function upsertCachedRawContact(contact: RawContact): Promise<void> {
  const current = await getCachedRawContacts();
  const index = current.findIndex((item) => item.id === contact.id);

  if (index >= 0) {
    current[index] = contact;
  } else {
    current.unshift(contact);
  }

  await cacheRawContacts(current);
}

export async function markCachedRawContactConverted(
  id: string,
  leadId: string
): Promise<void> {
  const current = await getCachedRawContacts();
  const next = current.map((item) =>
    item.id === id
      ? {
          ...item,
          converted_to_lead: true,
          lead_id: leadId,
          updated_at: new Date().toISOString(),
        }
      : item
  );

  await cacheRawContacts(next);
}
