import AsyncStorage from "@react-native-async-storage/async-storage";
import { getBookingById, updateBooking } from "./bookingStorage";

export type BookingPaymentMode = "Cash" | "UPI" | "Bank Transfer" | "Cheque";

export interface BookingPayment {
  id: string;
  bookingId: string;
  amount: number;
  paymentDate: string;
  mode: BookingPaymentMode;
  referenceNumber: string;
  notes: string;
  createdAt: string;
}

const STORAGE_KEY = "jmk_mobile_booking_payments";

function createId(): string {
  return `payment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePayment(value: Partial<BookingPayment>): BookingPayment {
  const now = new Date().toISOString();
  const amount = Number(value.amount || 0);

  return {
    id: value.id || createId(),
    bookingId: String(value.bookingId || ""),
    amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
    paymentDate: value.paymentDate || now.slice(0, 10),
    mode: value.mode || "Cash",
    referenceNumber: String(value.referenceNumber || "").trim(),
    notes: String(value.notes || "").trim(),
    createdAt: value.createdAt || now,
  };
}

async function savePayments(payments: BookingPayment[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
}

export async function getBookingPayments(bookingId?: string): Promise<BookingPayment[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    const payments = Array.isArray(parsed)
      ? parsed.map((item) => normalizePayment(item as Partial<BookingPayment>))
      : [];

    const filtered = bookingId
      ? payments.filter((payment) => payment.bookingId === bookingId)
      : payments;

    return filtered.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
  } catch (error) {
    console.error("Unable to read booking payments:", error);
    return [];
  }
}

export async function addBookingPayment(
  value: Partial<BookingPayment>
): Promise<BookingPayment> {
  const payment = normalizePayment(value);
  if (!payment.bookingId) throw new Error("Booking is required.");
  if (payment.amount <= 0) throw new Error("Payment amount must be greater than zero.");

  const booking = await getBookingById(payment.bookingId);
  if (!booking) throw new Error("Booking not found.");
  if (payment.amount > booking.balanceAmount) {
    throw new Error("Payment amount cannot be greater than booking balance.");
  }

  const payments = await getBookingPayments();
  await savePayments([payment, ...payments]);

  await updateBooking(booking.id, {
    receivedAmount: booking.receivedAmount + payment.amount,
  });

  return payment;
}

export async function deleteBookingPayment(id: string): Promise<boolean> {
  const payments = await getBookingPayments();
  const payment = payments.find((item) => item.id === id);
  if (!payment) return false;

  const next = payments.filter((item) => item.id !== id);
  await savePayments(next);

  const booking = await getBookingById(payment.bookingId);
  if (booking) {
    await updateBooking(booking.id, {
      receivedAmount: Math.max(booking.receivedAmount - payment.amount, booking.tokenAmount),
    });
  }

  return true;
}

export async function getBookingPaymentTotal(bookingId: string): Promise<number> {
  const payments = await getBookingPayments(bookingId);
  return payments.reduce((total, payment) => total + payment.amount, 0);
}
