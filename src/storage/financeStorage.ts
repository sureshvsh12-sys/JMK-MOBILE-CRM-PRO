import AsyncStorage from "@react-native-async-storage/async-storage";

export type FinanceEntryType = "Income" | "Expense";
export type FinanceCategory =
  | "Booking"
  | "Commission"
  | "Loan Service"
  | "Solar"
  | "Office"
  | "Salary"
  | "Marketing"
  | "Travel"
  | "Other";

export interface FinanceEntry {
  id: string;
  type: FinanceEntryType;
  category: FinanceCategory;
  amount: number;
  title: string;
  partyName: string;
  paymentMode: "Cash" | "UPI" | "Bank" | "Cheque" | "Other";
  entryDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceSummary {
  income: number;
  expense: number;
  balance: number;
  entries: number;
}

const STORAGE_KEY = "jmk_mobile_finance_entries";

const LEGACY_DEMO_IDS = new Set([
  "finance-sample-income",
  "finance-sample-expense",
]);

function createId(): string {
  return `finance-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeEntry(value: Partial<FinanceEntry>): FinanceEntry {
  const now = new Date().toISOString();
  const amount = Number(value.amount || 0);

  return {
    id: value.id || createId(),
    type: value.type === "Expense" ? "Expense" : "Income",
    category: value.category || "Other",
    amount: Number.isFinite(amount) && amount >= 0 ? amount : 0,
    title: String(value.title || "").trim(),
    partyName: String(value.partyName || "").trim(),
    paymentMode: value.paymentMode || "Cash",
    entryDate: value.entryDate || now.slice(0, 10),
    notes: String(value.notes || "").trim(),
    createdAt: value.createdAt || now,
    updatedAt: value.updatedAt || now,
  };
}

async function writeEntries(entries: FinanceEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function getFinanceEntries(): Promise<FinanceEntry[]> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return [];
    }

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    const entries = parsed
      .map((item) => normalizeEntry(item as Partial<FinanceEntry>))
      .filter((entry) => !LEGACY_DEMO_IDS.has(entry.id))
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate));

    if (entries.length !== parsed.length) {
      await writeEntries(entries);
    }

    return entries;
  } catch {
    return [];
  }
}

export async function getFinanceEntry(id: string): Promise<FinanceEntry | null> {
  const entries = await getFinanceEntries();
  return entries.find((entry) => entry.id === id) || null;
}

export async function saveFinanceEntry(
  value: Omit<FinanceEntry, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<FinanceEntry> {
  const entries = await getFinanceEntries();
  const existing = value.id ? entries.find((entry) => entry.id === value.id) : null;
  const now = new Date().toISOString();

  const entry = normalizeEntry({
    ...existing,
    ...value,
    id: existing?.id || value.id || createId(),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  });

  const next = existing
    ? entries.map((item) => (item.id === entry.id ? entry : item))
    : [entry, ...entries];

  await writeEntries(next);
  return entry;
}

export async function deleteFinanceEntry(id: string): Promise<void> {
  const entries = await getFinanceEntries();
  await writeEntries(entries.filter((entry) => entry.id !== id));
}

export function getFinanceSummary(entries: FinanceEntry[]): FinanceSummary {
  const income = entries
    .filter((entry) => entry.type === "Income")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const expense = entries
    .filter((entry) => entry.type === "Expense")
    .reduce((sum, entry) => sum + entry.amount, 0);

  return {
    income,
    expense,
    balance: income - expense,
    entries: entries.length,
  };
}
