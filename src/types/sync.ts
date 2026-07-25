export type SyncEntity =
  | "customers"
  | "leads"
  | "followups"
  | "bookings"
  | "bookingPayments"
  | "bookingInstallments"
  | "finance"
  | "solar"
  | "employees"
  | "notifications";

export type SyncConfig = {
  apiBaseUrl: string;
  autoSyncEnabled: boolean;
  lastSyncAt: string;
};

export type SyncQueueItem = {
  id: string;
  createdAt: string;
  attempts: number;
  payload: Record<SyncEntity, unknown[]>;
};

export type SyncResult = {
  success: boolean;
  queued: boolean;
  message: string;
  syncedAt?: string;
};
