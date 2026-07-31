import { getBookings } from "../storage/bookingStorage";
import { getCustomers } from "../storage/customerStorage";
import { getFinanceEntries } from "../storage/financeStorage";
import { getFollowUps } from "../storage/followUpStorage";
import { getCachedLeads } from "../storage/leadStorage";
import { getCachedRawContacts } from "../storage/rawContactStorage";
import { getSolarProjects } from "../storage/solarStorage";
import {
  calculateReportsSummary,
  type ReportsSummary,
} from "../utils/reportCalculations";

export async function getReportsSummary(): Promise<ReportsSummary> {
  const [customers, bookings, financeEntries, solarProjects, leads, rawContacts, followUps] =
    await Promise.all([
      getCustomers(),
      getBookings(),
      getFinanceEntries(),
      getSolarProjects(),
      getCachedLeads(),
      getCachedRawContacts(),
      getFollowUps(),
    ]);

  return calculateReportsSummary(
    customers,
    bookings,
    financeEntries,
    solarProjects,
    leads,
    rawContacts,
    followUps
  );
}
