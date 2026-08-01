export const DATABASE_NAME = "JMK Mobile CRM PRO";
export const DATABASE_VERSION = 3;

export const DATABASE_META_KEY = "jmk_mobile_database_meta";

export const STORAGE_KEYS = {
  auth: "jmk_mobile_auth",
  settings: "jmk_mobile_settings",
  leads: "jmk_mobile_leads",
  customers: "jmk_mobile_customers",
  followUps: "jmk_mobile_followups",
  bookings: "jmk_mobile_bookings",
  bookingPayments: "jmk_mobile_booking_payments",
  bookingInstallments: "jmk_mobile_booking_installments",
  financeEntries: "jmk_mobile_finance_entries",
  solarProjects: "jmk_mobile_solar_projects",
  employees: "jmk_mobile_employees",
  notifications: "jmk_mobile_notifications",
  customerActivities: "jmk_mobile_customer_activities",
  customerDocuments: "jmk_mobile_customer_documents",
} as const;

export type StorageCollectionName = keyof typeof STORAGE_KEYS;

export type DatabaseMeta = {
  databaseName: string;
  version: number;
  installedAt: string;
  migratedAt: string;
};
