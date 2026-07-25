import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { initializeDatabase } from "../storage/database";
import { getBookings } from "../storage/bookingStorage";
import { getCustomers } from "../storage/customerStorage";
import { getFinanceEntries, getFinanceSummary } from "../storage/financeStorage";
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
};

function isSameDate(value: string, target: Date): boolean {
  const date = new Date(value);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
}

export function useDashboardStats() {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await initializeDatabase();
      const [leads, customers, followUps, bookings, financeEntries, notifications, solar] =
        await Promise.all([
          getLeads(),
          getCustomers(),
          getFollowUps(),
          getBookings(),
          getFinanceEntries(),
          getNotifications(),
          getSolarProjects(),
        ]);

      const today = new Date();
      const financeSummary = getFinanceSummary(financeEntries);

      setData({
        totalLeads: leads.length,
        newLeadsThisMonth: leads.filter((lead) => {
          const createdAt = new Date(lead.createdAt);
          return (
            !Number.isNaN(createdAt.getTime()) &&
            createdAt.getMonth() === today.getMonth() &&
            createdAt.getFullYear() === today.getFullYear()
          );
        }).length,
        customers: customers.length,
        dueToday: followUps.filter(
          (item) => item.status === "Pending" && isSameDate(item.dueAt, today)
        ).length,
        activeBookings: bookings.filter((item) => item.status !== "Cancelled").length,
        bookingReceived: bookings.reduce(
          (sum, item) => sum + Number(item.receivedAmount || 0),
          0
        ),
        financeBalance: financeSummary.balance,
        solarProjects: solar.filter((item) => item.status !== "Cancelled").length,
        unreadNotifications: notifications.filter((item) => !item.isRead).length,
      });
    } catch (reason) {
      console.error("Unable to load dashboard:", reason);
      setData(EMPTY_DATA);
      setError("Dashboard data load nahi ho saka.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return { data, isLoading, error, refresh };
}
