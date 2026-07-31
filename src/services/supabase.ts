import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey
);

const isWebServer =
  Platform.OS === "web" && typeof window === "undefined";

const memoryStorage = {
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
};

export const supabase = createClient(
  supabaseUrl || "https://invalid.supabase.co",
  supabaseAnonKey || "missing-anon-key",
  {
    auth: {
      storage: isWebServer ? memoryStorage : AsyncStorage,
      autoRefreshToken: !isWebServer,
      persistSession: !isWebServer,
      detectSessionInUrl: false,
    },
  }
);