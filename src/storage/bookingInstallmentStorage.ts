import AsyncStorage from "@react-native-async-storage/async-storage";
import { getBookingById } from "./bookingStorage";

export type InstallmentStatus = "Pending" | "Paid" | "Overdue";

export interface BookingInstallment {
  id: string;
  bookingId: string;
  title: string;
  amount: number;
  dueDate: string;
  status: InstallmentStatus;
  paidDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "jmk_mobile_booking_installments";

function createId(): string {
  return `installment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toAmount(value: unknown): number {
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

function calculateStatus(
  dueDate: string,
  status: InstallmentStatus,
  paidDate: string
): InstallmentStatus {
  if (status === "Paid" || paidDate) return "Paid";
  const today = new Date().toISOString().slice(0, 10);
  return dueDate && dueDate < today ? "Overdue" : "Pending";
}

function normalizeInstallment(
  value: Partial<BookingInstallment>
): BookingInstallment {
  const now = new Date().toISOString();
  const dueDate = value.dueDate || now.slice(0, 10);
  const paidDate = String(value.paidDate || "");
  const requestedStatus = value.status || "Pending";

  return {
    id: value.id || createId(),
    bookingId: String(value.bookingId || ""),
    title: String(value.title || "Installment").trim(),
    amount: toAmount(value.amount),
    dueDate,
    status: calculateStatus(dueDate, requestedStatus, paidDate),
    paidDate,
    notes: String(value.notes || "").trim(),
    createdAt: value.createdAt || now,
    updatedAt: now,
  };
}

async function saveInstallments(items: BookingInstallment[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function getBookingInstallments(
  bookingId?: string
): Promise<BookingInstallment[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    const items = Array.isArray(parsed)
      ? parsed.map((item) =>
          normalizeInstallment(item as Partial<BookingInstallment>)
        )
      : [];

    const filtered = bookingId
      ? items.filter((item) => item.bookingId === bookingId)
      : items;

    return filtered.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  } catch (error) {
    console.error("Unable to read booking installments:", error);
    return [];
  }
}

export async function getBookingInstallmentById(
  id: string
): Promise<BookingInstallment | null> {
  const items = await getBookingInstallments();
  return items.find((item) => item.id === id) || null;
}

export async function addBookingInstallment(
  value: Partial<BookingInstallment>
): Promise<BookingInstallment> {
  const installment = normalizeInstallment(value);
  if (!installment.bookingId) throw new Error("Booking is required.");
  if (!installment.title) throw new Error("Installment title is required.");
  if (installment.amount <= 0) throw new Error("Amount must be greater than zero.");

  const booking = await getBookingById(installment.bookingId);
  if (!booking) throw new Error("Booking not found.");

  const current = await getBookingInstallments();
  const scheduledTotal = current
    .filter((item) => item.bookingId === installment.bookingId)
    .reduce((total, item) => total + item.amount, 0);

  if (scheduledTotal + installment.amount > booking.balanceAmount) {
    throw new Error("Installment total cannot exceed current booking balance.");
  }

  await saveInstallments([...current, installment]);
  return installment;
}

export async function updateBookingInstallment(
  id: string,
  updates: Partial<BookingInstallment>
): Promise<BookingInstallment | null> {
  const current = await getBookingInstallments();
  const existing = current.find((item) => item.id === id);
  if (!existing) return null;

  const updated = normalizeInstallment({
    ...existing,
    ...updates,
    id: existing.id,
    bookingId: existing.bookingId,
    createdAt: existing.createdAt,
  });

  const booking = await getBookingById(existing.bookingId);
  if (!booking) throw new Error("Booking not found.");

  const otherTotal = current
    .filter((item) => item.bookingId === existing.bookingId && item.id !== id)
    .reduce((total, item) => total + item.amount, 0);

  if (otherTotal + updated.amount > booking.balanceAmount) {
    throw new Error("Installment total cannot exceed current booking balance.");
  }

  await saveInstallments(
    current.map((item) => (item.id === id ? updated : item))
  );
  return updated;
}

export async function markInstallmentPaid(
  id: string
): Promise<BookingInstallment | null> {
  return updateBookingInstallment(id, {
    status: "Paid",
    paidDate: new Date().toISOString().slice(0, 10),
  });
}

export async function deleteBookingInstallment(id: string): Promise<boolean> {
  const current = await getBookingInstallments();
  const next = current.filter((item) => item.id !== id);
  if (next.length === current.length) return false;
  await saveInstallments(next);
  return true;
}
