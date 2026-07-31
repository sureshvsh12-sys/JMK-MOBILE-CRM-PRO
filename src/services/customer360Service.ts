import { getCustomerActivities } from "../storage/customerActivityStorage";
import { getFollowUps } from "../storage/followUpStorage";
import type { Customer360Summary } from "../types/customer";
import { isSupabaseConfigured, supabase } from "./supabase";

const EMPTY_SUMMARY: Customer360Summary = {
  followUps: 0,
  quotations: 0,
  payments: 0,
  calls: 0,
};

async function safeCloudCount(
  table: string,
  customerId: string
): Promise<number | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId);

    if (error) {
      console.warn(`Unable to count ${table}:`, error.message);
      return null;
    }

    return count ?? 0;
  } catch (error) {
    console.warn(`Unable to count ${table}:`, error);
    return null;
  }
}

async function getLocalSummary(customerId: string): Promise<Customer360Summary> {
  try {
    const [followUps, activities] = await Promise.all([
      getFollowUps(),
      getCustomerActivities(customerId),
    ]);

    return {
      followUps: followUps.filter(
        (item) => String(item.customerId) === String(customerId)
      ).length,
      quotations: 0,
      payments: 0,
      calls: activities.filter((item) => item.type === "call").length,
    };
  } catch (error) {
    console.warn("Unable to build local Customer 360 summary:", error);
    return EMPTY_SUMMARY;
  }
}

export async function fetchCustomer360Summary(
  customerId: string
): Promise<Customer360Summary> {
  const cleanCustomerId = String(customerId || "").trim();
  if (!cleanCustomerId) return EMPTY_SUMMARY;

  const localSummary = await getLocalSummary(cleanCustomerId);
  if (!isSupabaseConfigured) return localSummary;

  const [cloudFollowUps, cloudQuotations, cloudPayments, cloudCalls] =
    await Promise.all([
      safeCloudCount("followups", cleanCustomerId),
      safeCloudCount("quotations", cleanCustomerId),
      safeCloudCount("finance", cleanCustomerId),
      safeCloudCount("call_logs", cleanCustomerId),
    ]);

  return {
    followUps:
      cloudFollowUps === null
        ? localSummary.followUps
        : Math.max(cloudFollowUps, localSummary.followUps),
    quotations:
      cloudQuotations === null
        ? localSummary.quotations
        : cloudQuotations,
    payments:
      cloudPayments === null ? localSummary.payments : cloudPayments,
    calls:
      cloudCalls === null
        ? localSummary.calls
        : Math.max(cloudCalls, localSummary.calls),
  };
}
