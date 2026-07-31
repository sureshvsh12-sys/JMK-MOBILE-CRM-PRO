import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";

import {
  changeFollowUpStatus,
  filterFollowUps,
  getFollowUpSyncCount,
  listFollowUps,
  removeFollowUp,
  subscribeToFollowUps,
  syncFollowUps,
  type FollowUp,
  type FollowUpFilter,
  type FollowUpStatus,
} from "../services/followupsService";

export function useFollowups() {
  const [items, setItems] = useState<FollowUp[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FollowUpFilter>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (manual = false) => {
    manual ? setIsRefreshing(true) : setIsLoading(true);
    setError(null);
    try {
      const [nextItems, syncCount] = await Promise.all([listFollowUps(), getFollowUpSyncCount()]);
      setItems(nextItems);
      setPendingSyncCount(syncCount);
    } catch (reason) {
      console.error("Unable to load follow-ups:", reason);
      setError("Follow-ups load nahi ho sake.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      const unsubscribe = subscribeToFollowUps(() => void refresh());
      return unsubscribe;
    }, [refresh])
  );

  const filtered = useMemo(
    () => filterFollowUps(items, { search, status: filter }),
    [filter, items, search]
  );

  const updateStatus = useCallback(async (id: string, status: FollowUpStatus) => {
    await changeFollowUpStatus(id, status);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await removeFollowUp(id);
    await refresh();
  }, [refresh]);

  const sync = useCallback(async () => {
    await syncFollowUps();
    await refresh(true);
  }, [refresh]);

  return {
    items,
    filtered,
    search,
    setSearch,
    filter,
    setFilter,
    isLoading,
    isRefreshing,
    pendingSyncCount,
    error,
    refresh: () => refresh(true),
    sync,
    updateStatus,
    remove,
  };
}
