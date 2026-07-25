import AsyncStorage from "@react-native-async-storage/async-storage";

export type BookingStatus =
  | "New"
  | "Token Received"
  | "Agreement Pending"
  | "Registered"
  | "Cancelled";

export interface Booking {
  id: string;
  customerName: string;
  customerMobile: string;
  propertyName: string;
  propertyLocation: string;
  totalAmount: number;
  tokenAmount: number;
  receivedAmount: number;
  balanceAmount: number;
  bookingDate: string;
  status: BookingStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "jmk_mobile_bookings";

const LEGACY_DEMO_IDS = new Set(["booking-1"]);

function createId(): string {
  return `booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toAmount(value: unknown): number {
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

function normalizeBooking(value: Partial<Booking>): Booking {
  const now = new Date().toISOString();
  const totalAmount = toAmount(value.totalAmount);
  const tokenAmount = toAmount(value.tokenAmount);
  const receivedAmount = Math.max(toAmount(value.receivedAmount), tokenAmount);

  return {
    id: value.id || createId(),
    customerName: String(value.customerName || "").trim(),
    customerMobile: String(value.customerMobile || "").replace(/\D/g, "").slice(0, 10),
    propertyName: String(value.propertyName || "").trim(),
    propertyLocation: String(value.propertyLocation || "").trim(),
    totalAmount,
    tokenAmount,
    receivedAmount,
    balanceAmount: Math.max(totalAmount - receivedAmount, 0),
    bookingDate: value.bookingDate || now.slice(0, 10),
    status: value.status || "New",
    notes: String(value.notes || "").trim(),
    createdAt: value.createdAt || now,
    updatedAt: now,
  };
}

async function saveBookings(bookings: Booking[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

export async function getBookings(): Promise<Booking[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    const bookings = parsed
      .map((item) => normalizeBooking(item as Partial<Booking>))
      .filter((booking) => !LEGACY_DEMO_IDS.has(booking.id));

    if (bookings.length !== parsed.length) {
      await saveBookings(bookings);
    }

    return bookings;
  } catch (error) {
    console.error("Unable to read bookings:", error);
    return [];
  }
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const bookings = await getBookings();
  return bookings.find((booking) => booking.id === id) || null;
}

export async function addBooking(value: Partial<Booking>): Promise<Booking> {
  const bookings = await getBookings();
  const booking = normalizeBooking(value);
  await saveBookings([booking, ...bookings]);
  return booking;
}

export async function updateBooking(
  id: string,
  updates: Partial<Booking>
): Promise<Booking | null> {
  const bookings = await getBookings();
  let updated: Booking | null = null;

  const next = bookings.map((booking) => {
    if (booking.id !== id) return booking;
    updated = normalizeBooking({
      ...booking,
      ...updates,
      id: booking.id,
      createdAt: booking.createdAt,
    });
    return updated;
  });

  if (!updated) return null;
  await saveBookings(next);
  return updated;
}

export async function deleteBooking(id: string): Promise<boolean> {
  const bookings = await getBookings();
  const next = bookings.filter((booking) => booking.id !== id);
  if (next.length === bookings.length) return false;
  await saveBookings(next);
  return true;
}
