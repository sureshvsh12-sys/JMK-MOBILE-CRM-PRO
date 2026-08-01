import { useCallback, useEffect, useState } from "react";
import type { Lead, LeadSegment, LeadStage } from "../types/lead";
import { fetchLeads } from "../services/leadsService";
import { subscribeToCrmRealtime } from "../services/realtimeService";

export function useLeads(filters?: {
  segment?: LeadSegment | "all";
  stage?: LeadStage | "all";
  search?: string;
}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      setLeads(await fetchLeads(filters));
    } catch (err) {
      console.error("Unable to load leads:", err);
      setError(err instanceof Error ? err.message : "Leads load nahi ho saki.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters?.search, filters?.segment, filters?.stage]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = subscribeToCrmRealtime((change) => {
      if (change.table !== "leads") return;

      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        void load();
      }, 180);
    });

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      unsubscribe();
    };
  }, [load]);

  return { leads, loading, refreshing, error, reload: () => load(true) };
}
