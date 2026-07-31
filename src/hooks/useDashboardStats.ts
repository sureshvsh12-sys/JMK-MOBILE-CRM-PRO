import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import {
  subscribeToCrmRealtime,
} from "../services/realtimeService";
import {
  isSupabaseConfigured,
  supabase,
} from "../services/supabase";
import { getBookings } from "../storage/bookingStorage";
import { getCustomers } from "../storage/customerStorage";
import { initializeDatabase } from "../storage/database";
import {
  getFinanceEntries,
  getFinanceSummary,
} from "../storage/financeStorage";
import { getFollowUps } from "../storage/followUpStorage";
import { getLeads } from "../storage/leadStorage";
import { getNotifications } from "../storage/notificationStorage";
import { getSolarProjects } from "../storage/solarStorage";

export type DashboardData = {
  totalLeads: number;
  newLeadsThisMonth: number;
  customers: number;
  dueToday: number;
  activeBookings: number;
  bookingReceived: number;
  financeBalance: number;
  solarProjects: number;
  unreadNotifications: number;
  rawContacts: number;
  interestedRawContacts: number;
  overdueFollowups: number;
  source: "cloud" | "local";
};

const EMPTY_DATA: DashboardData = {
  totalLeads: 0,
  newLeadsThisMonth: 0,
  customers: 0,
  dueToday: 0,
  activeBookings: 0,
  bookingReceived: 0,
  financeBalance: 0,
  solarProjects: 0,
  unreadNotifications: 0,
  rawContacts: 0,
  interestedRawContacts: 0,
  overdueFollowups: 0,
  source: "local",
};

function validDate(value: unknown): Date | null {
  if (!value) return null;

  const date = new Date(String(value));

  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameDate(
  value: unknown,
  target: Date
): boolean {
  const date = validDate(value);

  return Boolean(
    date &&
      date.getFullYear() === target.getFullYear() &&
      date.getMonth() === target.getMonth() &&
      date.getDate() === target.getDate()
  );
}

function isBeforeToday(value: unknown): boolean {
  const date = validDate(value);

  if (!date) return false;

  const today = new Date();

  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date < today;
}

function statusOf(
  row: Record<string, unknown>
): string {
  return String(
    row.status ??
      row.stage ??
      row.call_status ??
      ""
  )
    .trim()
    .toLowerCase();
}

function dateOf(
  row: Record<string, unknown>
): unknown {
  return (
    row.date ??
    row.followup_date ??
    row.callback_date ??
    row.due_at
  );
}

async function countTable(
  table: string
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("id", {
      count: "exact",
      head: true,
    });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export function useDashboardStats() {
  const [data, setData] =
    useState<DashboardData>(EMPTY_DATA);
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const loadLocal =
    useCallback(async (): Promise<DashboardData> => {
      await initializeDatabase();

      const [
        leads,
        customers,
        followUps,
        bookings,
        financeEntries,
        notifications,
        solar,
      ] = await Promise.all([
        getLeads(),
        getCustomers(),
        getFollowUps(),
        getBookings(),
        getFinanceEntries(),
        getNotifications(),
        getSolarProjects(),
      ]);

      const today = new Date();
      const financeSummary =
        getFinanceSummary(financeEntries);

      return {
        ...EMPTY_DATA,
        totalLeads: leads.length,

        newLeadsThisMonth: leads.filter(
          (lead) => {
            const createdAt = validDate(
              lead.createdAt
            );

            return Boolean(
              createdAt &&
                createdAt.getMonth() ===
                  today.getMonth() &&
                createdAt.getFullYear() ===
                  today.getFullYear()
            );
          }
        ).length,

        customers: customers.length,

        dueToday: followUps.filter(
          (item) =>
            item.status === "Pending" &&
            isSameDate(item.dueAt, today)
        ).length,

        overdueFollowups: followUps.filter(
          (item) =>
            item.status === "Pending" &&
            isBeforeToday(item.dueAt)
        ).length,

        activeBookings: bookings.filter(
          (item) =>
            item.status !== "Cancelled"
        ).length,

        bookingReceived: bookings.reduce(
          (sum, item) =>
            sum +
            Number(item.receivedAmount || 0),
          0
        ),

        financeBalance:
          financeSummary.balance,

        solarProjects: solar.filter(
          (item) =>
            item.status !== "Cancelled"
        ).length,

        unreadNotifications:
          notifications.filter(
            (item) => !item.isRead
          ).length,

        source: "local",
      };
    }, []);

  const loadCloud =
    useCallback(async (): Promise<DashboardData> => {
      const today = new Date();

      const monthStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      ).toISOString();

      const [
        leadsCount,
        customersCount,
        rawContactsCount,
        solarCount,
        leadsMonthResult,
        rawResult,
        followupsResult,
        financeResult,
        bookingsResult,
      ] = await Promise.all([
        countTable("leads"),
        countTable("customers"),
        countTable("raw_contacts"),
        countTable("solar"),

        supabase
          .from("leads")
          .select("id", {
            count: "exact",
            head: true,
          })
          .gte("created_at", monthStart),

        supabase
          .from("raw_contacts")
          .select(
            "id,status,call_status"
          ),

        supabase
          .from("followups")
          .select(
            "id,status,date,followup_date,callback_date,due_at"
          ),

        supabase
          .from("finance")
          .select(
            "type,amount,received_amount,received,pending_amount"
          ),

        supabase
          .from("bookings")
          .select(
            "status,received_amount"
          ),
      ]);

      const firstError = [
        leadsMonthResult,
        rawResult,
        followupsResult,
        financeResult,
        bookingsResult,
      ].find((item) => item.error)?.error;

      if (firstError) {
        throw firstError;
      }

      const rawRows =
        (rawResult.data ??
          []) as Record<
          string,
          unknown
        >[];

      const followupRows =
        (followupsResult.data ??
          []) as Record<
          string,
          unknown
        >[];

      const financeRows =
        (financeResult.data ??
          []) as Record<
          string,
          unknown
        >[];

      const bookingRows =
        (bookingsResult.data ??
          []) as Record<
          string,
          unknown
        >[];

      const pendingFollowups =
        followupRows.filter(
          (row) =>
            ![
              "completed",
              "done",
              "cancelled",
            ].includes(statusOf(row))
        );

      const financeBalance =
        financeRows.reduce(
          (sum, row) => {
            const amount =
              Number(
                row.received_amount ??
                  row.received ??
                  row.amount ??
                  0
              ) || 0;

            return statusOf({
              status: row.type,
            }) === "expense"
              ? sum - amount
              : sum + amount;
          },
          0
        );

      return {
        ...EMPTY_DATA,

        totalLeads: leadsCount,

        newLeadsThisMonth:
          leadsMonthResult.count ?? 0,

        customers: customersCount,

        rawContacts: rawContactsCount,

        interestedRawContacts:
          rawRows.filter((row) =>
            [
              "interested",
              "converted",
              "converted to lead",
            ].includes(statusOf(row))
          ).length,

        dueToday:
          pendingFollowups.filter(
            (row) =>
              isSameDate(
                dateOf(row),
                today
              )
          ).length,

        overdueFollowups:
          pendingFollowups.filter(
            (row) =>
              isBeforeToday(
                dateOf(row)
              )
          ).length,

        activeBookings:
          bookingRows.filter(
            (row) =>
              statusOf(row) !==
              "cancelled"
          ).length,

        bookingReceived:
          bookingRows.reduce(
            (sum, row) =>
              sum +
              (Number(
                row.received_amount ??
                  0
              ) || 0),
            0
          ),

        financeBalance,
        solarProjects: solarCount,
        source: "cloud",
      };
    }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextData =
        isSupabaseConfigured
          ? await loadCloud()
          : await loadLocal();

      setData(nextData);
    } catch (reason) {
      console.error(
        "Unable to load cloud dashboard:",
        reason
      );

      try {
        setData(await loadLocal());

        setError(
          "Cloud dashboard load nahi hua; local data dikhaya ja raha hai."
        );
      } catch {
        setData(EMPTY_DATA);

        setError(
          "Dashboard data load nahi ho saka."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadCloud, loadLocal]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let refreshTimer:
      | ReturnType<typeof setTimeout>
      | null = null;

    const unsubscribe =
      subscribeToCrmRealtime(() => {
        if (refreshTimer) {
          clearTimeout(refreshTimer);
        }

        refreshTimer = setTimeout(() => {
          void refresh();
        }, 350);
      });

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      unsubscribe();
    };
  }, [refresh]);

  return {
    data,
    isLoading,
    error,
    refresh,
  };
}