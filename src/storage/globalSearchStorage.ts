import { getBookings } from "./bookingStorage";
import { getCustomers } from "./customerStorage";
import { getFollowUps } from "./followUpStorage";
import { getLeads } from "./leadStorage";

export type SearchModule =
  | "Customers"
  | "Leads"
  | "Bookings"
  | "Follow-ups";

export type GlobalSearchResult = {
  id: string;
  module: SearchModule;
  title: string;
  subtitle: string;
  detail: string;
  mobile?: string;
  route: string;
  routeParams?: Record<string, string>;
  searchText: string;
};

function normalize(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function includesQuery(
  values: unknown[],
  query: string
): boolean {
  return values.some((value) =>
    normalize(value).includes(query)
  );
}

export async function searchGlobalData(
  rawQuery: string
): Promise<GlobalSearchResult[]> {
  const query = normalize(rawQuery);

  if (query.length < 2) {
    return [];
  }

  const [
    customers,
    leads,
    bookings,
    followUps,
  ] = await Promise.all([
    getCustomers(),
    getLeads(),
    getBookings(),
    getFollowUps(),
  ]);

  const customerResults: GlobalSearchResult[] =
    customers
      .filter((customer) =>
        includesQuery(
          [
            customer.name,
            customer.mobile,
            customer.email,
            customer.city,
            customer.segment,
            customer.status,
            customer.source,
            customer.occupation,
            customer.notes,
          ],
          query
        )
      )
      .map((customer) => ({
        id: `customer-${customer.id}`,
        module: "Customers",
        title: customer.name,
        subtitle:
          customer.mobile ||
          customer.email ||
          "Customer",
        detail: `${customer.segment} • ${customer.status}${
          customer.city
            ? ` • ${customer.city}`
            : ""
        }`,
        mobile: customer.mobile,
        route: "/customer-360",
        routeParams: {
          id: customer.id,
        },
        searchText: [
          customer.name,
          customer.mobile,
          customer.email,
          customer.city,
          customer.segment,
          customer.status,
        ].join(" "),
      }));

  const leadResults: GlobalSearchResult[] = leads
    .filter((lead) =>
      includesQuery(
        [
          lead.customer,
          lead.mobile,
          lead.email,
          lead.segment,
          lead.stage,
          lead.property,
          lead.location,
          lead.budget,
          lead.priority,
          lead.temperature,
          lead.notes,
        ],
        query
      )
    )
    .map((lead) => ({
      id: `lead-${lead.id}`,
      module: "Leads",
      title: lead.customer,
      subtitle:
        lead.mobile ||
        lead.property ||
        "Lead",
      detail: `${lead.segment} • ${lead.stage} • ${lead.priority}`,
      mobile: lead.mobile,
      route: "/lead-form",
      routeParams: {
        id: lead.id,
      },
      searchText: [
        lead.customer,
        lead.mobile,
        lead.segment,
        lead.stage,
        lead.property,
        lead.location,
      ].join(" "),
    }));

  const bookingResults: GlobalSearchResult[] =
    bookings
      .filter((booking) =>
        includesQuery(
          [
            booking.customerName,
            booking.customerMobile,
            booking.propertyName,
            booking.propertyLocation,
            booking.status,
            booking.notes,
            booking.totalAmount,
            booking.receivedAmount,
            booking.balanceAmount,
          ],
          query
        )
      )
      .map((booking) => ({
        id: `booking-${booking.id}`,
        module: "Bookings",
        title: booking.customerName,
        subtitle:
          booking.propertyName ||
          booking.customerMobile ||
          "Booking",
        detail: `${booking.status} • Balance ₹${booking.balanceAmount.toLocaleString(
          "en-IN"
        )}`,
        mobile: booking.customerMobile,
        route: "/booking-form",
        routeParams: {
          id: booking.id,
        },
        searchText: [
          booking.customerName,
          booking.customerMobile,
          booking.propertyName,
          booking.propertyLocation,
          booking.status,
        ].join(" "),
      }));

  const followUpResults: GlobalSearchResult[] =
    followUps
      .filter((followUp) =>
        includesQuery(
          [
            followUp.customerName,
            followUp.mobile,
            followUp.subject,
            followUp.notes,
            followUp.status,
            followUp.priority,
            followUp.mode,
            followUp.assignedTo,
          ],
          query
        )
      )
      .map((followUp) => ({
        id: `followup-${followUp.id}`,
        module: "Follow-ups",
        title: followUp.customerName,
        subtitle:
          followUp.subject ||
          followUp.mobile ||
          "Follow-up",
        detail: `${followUp.status} • ${followUp.priority} • ${followUp.mode}`,
        mobile: followUp.mobile,
        route: "/followup-form",
        routeParams: {
          id: followUp.id,
        },
        searchText: [
          followUp.customerName,
          followUp.mobile,
          followUp.subject,
          followUp.status,
          followUp.priority,
        ].join(" "),
      }));

  return [
    ...customerResults,
    ...leadResults,
    ...bookingResults,
    ...followUpResults,
  ].sort((first, second) =>
    first.title.localeCompare(second.title)
  );
}
