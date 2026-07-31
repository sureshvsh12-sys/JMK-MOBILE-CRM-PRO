import { supabase } from "./supabase";
import type { Customer360Summary } from "../types/customer";

async function safeCount(table: string, customerId: string): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId);

  if (error) {
    console.warn(`Unable to count ${table}:`, error.message);
    return 0;
  }

  return count ?? 0;
}

export async function fetchCustomer360Summary(
  customerId: string
): Promise<Customer360Summary> {
  const [followUps, quotations, payments, calls] = await Promise.all([
    safeCount("followups", customerId),
    safeCount("quotations", customerId),
    safeCount("finance", customerId),
    safeCount("call_logs", customerId),
  ]);

  return { followUps, quotations, payments, calls };
}
