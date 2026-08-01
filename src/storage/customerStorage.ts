import AsyncStorage from "@react-native-async-storage/async-storage";

import { isSupabaseConfigured, supabase } from "../services/supabase";
import type {
  Customer,
  CustomerInput,
  CustomerSegment,
  CustomerStatus,
} from "../types/customer";

const CUSTOMER_CACHE_KEY = "jmk_mobile_customers";
const CUSTOMER_PENDING_KEY = "jmk_mobile_customer_pending_operations";
const LEGACY_DEMO_CUSTOMER_IDS = new Set(["customer-1", "customer-2"]);

const CUSTOMER_COLUMNS = [
  "id",
  "name",
  "full_name",
  "mobile",
  "alternate_mobile",
  "email",
  "segment",
  "status",
  "city",
  "location",
  "address",
  "occupation",
  "source",
  "assigned_to",
  "notes",
  "lead_id",
  "raw_contact_id",
  "created_at",
  "updated_at",
].join(",");

type CustomerRow = Record<string, unknown>;
type PendingOperation =
  | { id: string; type: "create"; customer: Customer }
  | { id: string; type: "update"; customer: Customer }
  | { id: string; type: "delete"; customerId: string };

function normalizeSegment(value: unknown): CustomerSegment {
  const segment = String(value || "assets").toLowerCase();
  if (segment === "finance") return "Finance";
  if (segment === "solar") return "Solar";
  return "Assets";
}

function normalizeStatus(value: unknown): CustomerStatus {
  const status = String(value || "Active").toLowerCase();
  if (status === "inactive") return "Inactive";
  if (status === "prospect") return "Prospect";
  return "Active";
}

function toDatabaseSegment(segment: CustomerSegment): string {
  return segment.toLowerCase();
}

function mapCustomer(row: CustomerRow): Customer {
  return {
    id: String(row.id || ""),
    name: String(row.full_name || row.name || ""),
    mobile: String(row.mobile || ""),
    alternateMobile: String(row.alternate_mobile || ""),
    email: String(row.email || ""),
    segment: normalizeSegment(row.segment),
    status: normalizeStatus(row.status),
    city: String(row.city || row.location || ""),
    address: String(row.address || ""),
    occupation: String(row.occupation || ""),
    source: String(row.source || "Mobile App"),
    assignedTo: String(row.assigned_to || "Admin"),
    notes: String(row.notes || ""),
    leadId: row.lead_id ? String(row.lead_id) : null,
    rawContactId: row.raw_contact_id ? String(row.raw_contact_id) : null,
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || row.created_at || ""),
  };
}

function toPayload(value: CustomerInput | Customer) {
  const name = value.name.trim();
  const city = value.city.trim();

  return {
    name,
    full_name: name,
    mobile: value.mobile.replace(/\D/g, ""),
    alternate_mobile: value.alternateMobile.replace(/\D/g, "") || null,
    email: value.email.trim().toLowerCase() || null,
    segment: toDatabaseSegment(value.segment),
    status: value.status,
    city: city || null,
    location: city || null,
    address: value.address.trim() || null,
    occupation: value.occupation.trim() || null,
    source: value.source.trim() || "Mobile App",
    assigned_to: value.assignedTo.trim() || "Admin",
    notes: value.notes.trim() || null,
    updated_at: new Date().toISOString(),
  };
}

function createLocalId(): string {
  return `local-customer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readCustomers(): Promise<Customer[]> {
  try {
    const value = await AsyncStorage.getItem(CUSTOMER_CACHE_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    if (!Array.isArray(parsed)) return [];

    const customers = (parsed as Customer[]).filter(
      (customer) =>
        customer &&
        !LEGACY_DEMO_CUSTOMER_IDS.has(String(customer.id || ""))
    );

    if (customers.length !== parsed.length) {
      await saveCustomers(customers);
    }

    return customers;
  } catch {
    return [];
  }
}

async function saveCustomers(customers: Customer[]): Promise<void> {
  const sorted = customers
    .filter(
      (customer) =>
        customer &&
        !LEGACY_DEMO_CUSTOMER_IDS.has(String(customer.id || ""))
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  await AsyncStorage.setItem(CUSTOMER_CACHE_KEY, JSON.stringify(sorted));
}

async function readPendingOperations(): Promise<PendingOperation[]> {
  try {
    const value = await AsyncStorage.getItem(CUSTOMER_PENDING_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? (parsed as PendingOperation[]) : [];
  } catch {
    return [];
  }
}

async function savePendingOperations(operations: PendingOperation[]): Promise<void> {
  await AsyncStorage.setItem(CUSTOMER_PENDING_KEY, JSON.stringify(operations));
}

async function queueOperation(operation: PendingOperation): Promise<void> {
  const operations = await readPendingOperations();
  const filtered = operations.filter((item) => {
    if (operation.type === "delete") {
      if (item.type === "delete") return item.customerId !== operation.customerId;
      return item.customer.id !== operation.customerId;
    }

    if (item.type === "delete") return item.customerId !== operation.customer.id;
    return item.customer.id !== operation.customer.id;
  });

  await savePendingOperations([...filtered, operation]);
}

async function replaceLocalCustomer(customer: Customer): Promise<void> {
  const customers = await readCustomers();
  await saveCustomers([
    customer,
    ...customers.filter((item) => item.id !== customer.id),
  ]);
}

async function removeLocalCustomer(id: string): Promise<void> {
  const customers = await readCustomers();
  await saveCustomers(customers.filter((item) => item.id !== id));
}

async function flushPendingOperations(): Promise<void> {
  if (!isSupabaseConfigured) return;

  const operations = await readPendingOperations();
  if (!operations.length) return;

  const remaining: PendingOperation[] = [];

  for (const operation of operations) {
    try {
      if (operation.type === "delete") {
        if (!operation.customerId.startsWith("local-customer-")) {
          const { error } = await supabase
            .from("customers")
            .delete()
            .eq("id", operation.customerId);
          if (error) throw error;
        }
        continue;
      }

      if (operation.type === "create") {
        const { data, error } = await supabase
          .from("customers")
          .insert({
            ...toPayload(operation.customer),
            created_at: operation.customer.createdAt,
          })
          .select(CUSTOMER_COLUMNS)
          .single();
        if (error) throw error;

        const cloudCustomer = mapCustomer(data as CustomerRow);
        const customers = await readCustomers();
        await saveCustomers([
          cloudCustomer,
          ...customers.filter((item) => item.id !== operation.customer.id),
        ]);
        continue;
      }

      if (operation.customer.id.startsWith("local-customer-")) {
        remaining.push({
          id: operation.id,
          type: "create",
          customer: operation.customer,
        });
        continue;
      }

      const { data, error } = await supabase
        .from("customers")
        .update(toPayload(operation.customer))
        .eq("id", operation.customer.id)
        .select(CUSTOMER_COLUMNS)
        .single();
      if (error) throw error;
      await replaceLocalCustomer(mapCustomer(data as CustomerRow));
    } catch {
      remaining.push(operation);
    }
  }

  await savePendingOperations(remaining);
}

function applyFilters(
  customers: Customer[],
  options?: {
    segment?: CustomerSegment | "All";
    status?: CustomerStatus | "All";
    search?: string;
    limit?: number;
  }
): Customer[] {
  const search = options?.search?.trim().toLowerCase() || "";
  return customers
    .filter((customer) => {
      const segmentMatches =
        !options?.segment ||
        options.segment === "All" ||
        customer.segment === options.segment;
      const statusMatches =
        !options?.status ||
        options.status === "All" ||
        customer.status === options.status;
      const searchMatches =
        !search ||
        [
          customer.name,
          customer.mobile,
          customer.alternateMobile,
          customer.email,
          customer.city,
          customer.segment,
          customer.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);
      return segmentMatches && statusMatches && searchMatches;
    })
    .slice(0, options?.limit ?? 500);
}

export async function getCustomers(options?: {
  segment?: CustomerSegment | "All";
  status?: CustomerStatus | "All";
  search?: string;
  limit?: number;
}): Promise<Customer[]> {
  const cachedCustomers = await readCustomers();

  if (!isSupabaseConfigured) {
    return applyFilters(cachedCustomers, options);
  }

  try {
    await flushPendingOperations();

    const { data, error } = await supabase
      .from("customers")
      .select(CUSTOMER_COLUMNS)
      .order("updated_at", { ascending: false })
      .limit(500);

    if (error) throw error;
    const cloudCustomers = (data ?? []).map((row) =>
      mapCustomer(row as CustomerRow)
    );
    const pending = await readPendingOperations();
    const localPendingCustomers = pending
      .filter(
        (item): item is Extract<PendingOperation, { type: "create" | "update" }> =>
          item.type === "create" || item.type === "update"
      )
      .map((item) => item.customer);
    const deletedIds = new Set(
      pending
        .filter(
          (item): item is Extract<PendingOperation, { type: "delete" }> =>
            item.type === "delete"
        )
        .map((item) => item.customerId)
    );
    const pendingIds = new Set(localPendingCustomers.map((item) => item.id));
    const merged = [
      ...localPendingCustomers,
      ...cloudCustomers.filter(
        (item) => !pendingIds.has(item.id) && !deletedIds.has(item.id)
      ),
    ];

    await saveCustomers(merged);
    return applyFilters(merged, options);
  } catch {
    return applyFilters(cachedCustomers, options);
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const cached = (await readCustomers()).find((item) => item.id === id) ?? null;
  if (!isSupabaseConfigured || id.startsWith("local-customer-")) return cached;

  try {
    const { data, error } = await supabase
      .from("customers")
      .select(CUSTOMER_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return cached;

    const customer = mapCustomer(data as CustomerRow);
    await replaceLocalCustomer(customer);
    return customer;
  } catch {
    return cached;
  }
}

export async function addCustomer(value: CustomerInput): Promise<Customer> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({ ...toPayload(value), created_at: now })
        .select(CUSTOMER_COLUMNS)
        .single();
      if (error) throw error;

      const customer = mapCustomer(data as CustomerRow);
      await replaceLocalCustomer(customer);
      return customer;
    } catch {
      // Save locally below and sync automatically on the next successful load.
    }
  }

  const customer: Customer = {
    ...value,
    id: createLocalId(),
    leadId: null,
    rawContactId: null,
    createdAt: now,
    updatedAt: now,
  };
  await replaceLocalCustomer(customer);
  await queueOperation({
    id: `customer-create-${Date.now()}`,
    type: "create",
    customer,
  });
  return customer;
}

export async function updateCustomer(
  id: string,
  updates: CustomerInput
): Promise<Customer> {
  const existing = await getCustomerById(id);
  if (!existing) throw new Error("Customer not found.");

  const updatedCustomer: Customer = {
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  await replaceLocalCustomer(updatedCustomer);

  if (isSupabaseConfigured && !id.startsWith("local-customer-")) {
    try {
      const { data, error } = await supabase
        .from("customers")
        .update(toPayload(updatedCustomer))
        .eq("id", id)
        .select(CUSTOMER_COLUMNS)
        .single();
      if (error) throw error;

      const cloudCustomer = mapCustomer(data as CustomerRow);
      await replaceLocalCustomer(cloudCustomer);
      return cloudCustomer;
    } catch {
      // Keep the local update and queue it for later.
    }
  }

  await queueOperation({
    id: `customer-update-${Date.now()}`,
    type: id.startsWith("local-customer-") ? "create" : "update",
    customer: updatedCustomer,
  });
  return updatedCustomer;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  await removeLocalCustomer(id);

  if (isSupabaseConfigured && !id.startsWith("local-customer-")) {
    try {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch {
      // Queue deletion below.
    }
  }

  await queueOperation({
    id: `customer-delete-${Date.now()}`,
    type: "delete",
    customerId: id,
  });
  return true;
}

export function subscribeToCustomers(onChange: () => void) {
  if (!isSupabaseConfigured) return () => undefined;

  const channel = supabase
    .channel(`mobile-customers-${Date.now()}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "customers" },
      onChange
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
