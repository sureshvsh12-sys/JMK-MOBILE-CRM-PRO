import type { Booking } from "../storage/bookingStorage";
import type { Customer } from "../types/customer";
import type { FinanceEntry } from "../storage/financeStorage";
import type { SolarProject } from "../storage/solarStorage";
import type { Lead } from "../types/lead";
import type { RawContact } from "../types/rawContact";
import type { FollowUp } from "../storage/followUpStorage";

export type SegmentReport = {
  segment: "Finance" | "Assets" | "Solar";
  rawContacts: number;
  leads: number;
  customers: number;
  leadValue: number;
};

export type ReportsSummary = {
  rawContacts: number;
  interestedRawContacts: number;
  leads: number;
  activeLeads: number;
  convertedLeads: number;
  customers: number;
  conversionRate: number;
  pendingFollowUps: number;
  overdueFollowUps: number;
  dueTodayFollowUps: number;
  bookings: number;
  bookingValue: number;
  bookingReceived: number;
  bookingBalance: number;
  income: number;
  expense: number;
  netBalance: number;
  solarProjects: number;
  solarCapacityKw: number;
  solarValue: number;
  solarBalance: number;
  segments: SegmentReport[];
};

export type ReportBarItem = {
  label: string;
  value: number;
  displayValue: string;
};

export type PipelineBarItem = ReportBarItem;

export function formatCurrency(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `₹${safe.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function normalizeSegment(value: string): "Finance" | "Assets" | "Solar" {
  const segment = value.toLowerCase();
  if (segment === "finance") return "Finance";
  if (segment === "solar") return "Solar";
  return "Assets";
}

export function calculateReportsSummary(
  customers: Customer[],
  bookings: Booking[],
  financeEntries: FinanceEntry[],
  solarProjects: SolarProject[],
  leads: Lead[] = [],
  rawContacts: RawContact[] = [],
  followUps: FollowUp[] = []
): ReportsSummary {
  const bookingValue = bookings.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
  const bookingReceived = bookings.reduce(
    (sum, item) => sum + Number(item.receivedAmount || 0),
    0
  );
  const income = financeEntries
    .filter((item) => item.type === "Income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expense = financeEntries
    .filter((item) => item.type === "Expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const solarCapacityKw = solarProjects.reduce(
    (sum, item) => sum + Number(item.systemSizeKw || 0),
    0
  );
  const solarValue = solarProjects.reduce(
    (sum, item) => sum + Number(item.projectValue || 0),
    0
  );
  const solarBalance = solarProjects.reduce(
    (sum, item) => sum + Number(item.balanceAmount || 0),
    0
  );

  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const pendingFollowUps = followUps.filter((item) => item.status === "Pending");
  const overdueFollowUps = pendingFollowUps.filter((item) => {
    const due = new Date(item.dueAt);
    return !Number.isNaN(due.getTime()) && due < today;
  }).length;
  const dueTodayFollowUps = pendingFollowUps.filter((item) => {
    const due = new Date(item.dueAt);
    return !Number.isNaN(due.getTime()) && due >= today && due < tomorrow;
  }).length;

  const convertedLeads = leads.filter(
    (item) => Boolean(item.customerId || item.convertedAt) || item.stage === "Completed"
  ).length;
  const activeLeads = leads.filter(
    (item) => item.stage !== "Completed" && item.stage !== "Lost"
  ).length;

  const segments: SegmentReport[] = (["Finance", "Assets", "Solar"] as const).map(
    (segment) => ({
      segment,
      rawContacts: rawContacts.filter((item) => normalizeSegment(item.segment) === segment).length,
      leads: leads.filter((item) => normalizeSegment(item.segment) === segment).length,
      customers: customers.filter((item) => item.segment === segment).length,
      leadValue: leads
        .filter((item) => normalizeSegment(item.segment) === segment)
        .reduce((sum, item) => sum + Number(item.value || 0), 0),
    })
  );

  return {
    rawContacts: rawContacts.length,
    interestedRawContacts: rawContacts.filter(
      (item) => item.call_status === "Interested" || item.converted_to_lead
    ).length,
    leads: leads.length,
    activeLeads,
    convertedLeads,
    customers: customers.length,
    conversionRate: leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0,
    pendingFollowUps: pendingFollowUps.length,
    overdueFollowUps,
    dueTodayFollowUps,
    bookings: bookings.length,
    bookingValue,
    bookingReceived,
    bookingBalance: Math.max(bookingValue - bookingReceived, 0),
    income,
    expense,
    netBalance: income - expense,
    solarProjects: solarProjects.length,
    solarCapacityKw,
    solarValue,
    solarBalance,
    segments,
  };
}

export function createBusinessMix(summary: ReportsSummary): ReportBarItem[] {
  return [
    {
      label: "Assets",
      value: summary.bookingValue,
      displayValue: formatCurrency(summary.bookingValue),
    },
    {
      label: "Finance",
      value: summary.income,
      displayValue: formatCurrency(summary.income),
    },
    {
      label: "Solar",
      value: summary.solarValue,
      displayValue: formatCurrency(summary.solarValue),
    },
  ];
}

export function createPipelineMix(summary: ReportsSummary): PipelineBarItem[] {
  return [
    { label: "Raw Contacts", value: summary.rawContacts, displayValue: String(summary.rawContacts) },
    { label: "Leads", value: summary.leads, displayValue: String(summary.leads) },
    { label: "Customers", value: summary.customers, displayValue: String(summary.customers) },
  ];
}
