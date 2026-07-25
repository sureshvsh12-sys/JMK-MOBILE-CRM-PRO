import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  Customer,
  CustomerSegment,
  CustomerStatus,
} from "../types/customer";

const CUSTOMERS_STORAGE_KEY = "jmk_mobile_customers";

const LEGACY_DEMO_IDS = new Set(["customer-1", "customer-2"]);

function createId(): string {
  return `customer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCustomer(value: Partial<Customer>): Customer {
  const now = new Date().toISOString();

  return {
    id: value.id || createId(),
    name: String(value.name || "").trim(),
    mobile: String(value.mobile || "").replace(/\D/g, ""),
    alternateMobile: String(value.alternateMobile || "").replace(/\D/g, ""),
    email: String(value.email || "").trim().toLowerCase(),
    segment: (value.segment as CustomerSegment) || "Assets",
    status: (value.status as CustomerStatus) || "Prospect",
    city: String(value.city || "").trim(),
    address: String(value.address || "").trim(),
    occupation: String(value.occupation || "").trim(),
    source: String(value.source || "").trim() || "Mobile App",
    assignedTo: String(value.assignedTo || "").trim() || "Admin",
    notes: String(value.notes || "").trim(),
    createdAt: value.createdAt || now,
    updatedAt: now,
  };
}

async function saveCustomers(customers: Customer[]): Promise<void> {
  await AsyncStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
}

export async function getCustomers(): Promise<Customer[]> {
  try {
    const storedValue = await AsyncStorage.getItem(CUSTOMERS_STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    const customers = parsedValue
      .map((item) => normalizeCustomer(item as Partial<Customer>))
      .filter((customer) => !LEGACY_DEMO_IDS.has(customer.id));

    if (customers.length !== parsedValue.length) {
      await saveCustomers(customers);
    }

    return customers;
  } catch (error) {
    console.error("Unable to read customers:", error);
    return [];
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const customers = await getCustomers();
  return customers.find((customer) => customer.id === id) || null;
}

export async function addCustomer(value: Partial<Customer>): Promise<Customer> {
  const customers = await getCustomers();
  const customer = normalizeCustomer(value);
  await saveCustomers([customer, ...customers]);
  return customer;
}

export async function updateCustomer(
  id: string,
  updates: Partial<Customer>
): Promise<Customer | null> {
  const customers = await getCustomers();
  let updatedCustomer: Customer | null = null;

  const nextCustomers = customers.map((customer) => {
    if (customer.id !== id) return customer;

    updatedCustomer = normalizeCustomer({
      ...customer,
      ...updates,
      id: customer.id,
      createdAt: customer.createdAt,
    });

    return updatedCustomer;
  });

  if (!updatedCustomer) return null;

  await saveCustomers(nextCustomers);
  return updatedCustomer;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const customers = await getCustomers();
  const nextCustomers = customers.filter((customer) => customer.id !== id);

  if (nextCustomers.length === customers.length) return false;

  await saveCustomers(nextCustomers);
  return true;
}
