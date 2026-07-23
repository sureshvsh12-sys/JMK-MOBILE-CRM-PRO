import type { Booking } from "../storage/bookingStorage";
import type { Customer } from "../types/customer";
import type { FinanceEntry } from "../storage/financeStorage";
import type { SolarProject } from "../storage/solarStorage";

export type ReportsSummary = {
  customers: number;
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
};

export type ReportBarItem = {
  label: string;
  value: number;
  displayValue: string;
};

export function formatCurrency(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `₹${safe.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function calculateReportsSummary(
  customers: Customer[],
  bookings: Booking[],
  financeEntries: FinanceEntry[],
  solarProjects: SolarProject[]
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

  return {
    customers: customers.length,
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
