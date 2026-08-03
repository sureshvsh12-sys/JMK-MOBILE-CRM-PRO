import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useColorScheme } from "react-native";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export type AppPalette = {
  mode: ResolvedTheme;
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceRaised: string;
  surfaceSoft: string;
  text: string;
  textMuted: string;
  textSoft: string;
  border: string;
  borderSoft: string;
  header: string;
  navigation: string;
  primary: string;
  primarySoft: string;
  finance: string;
  assets: string;
  solar: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  overlay: string;
};

const THEME_MODE_KEY = "jmk_mobile_theme_mode";

const DARK_PALETTE: AppPalette = {
  mode: "dark",
  background: "#07121F",
  backgroundAlt: "#0A1929",
  surface: "#102238",
  surfaceRaised: "#17304C",
  surfaceSoft: "#1D3B5B",
  text: "#F8FAFC",
  textMuted: "#9FB2C8",
  textSoft: "#D5DFEA",
  border: "#29455F",
  borderSoft: "rgba(148,163,184,0.20)",
  header: "#081A2C",
  navigation: "#061522",
  primary: "#E53935",
  primarySoft: "rgba(229,57,53,0.15)",
  finance: "#2DD4BF",
  assets: "#F59E0B",
  solar: "#FB923C",
  success: "#22C55E",
  warning: "#FBBF24",
  danger: "#EF4444",
  info: "#60A5FA",
  overlay: "rgba(2,6,23,0.72)",
};

const LIGHT_PALETTE: AppPalette = {
  mode: "light",
  background: "#F4F8FC",
  backgroundAlt: "#EAF2F9",
  surface: "#FFFFFF",
  surfaceRaised: "#F8FBFE",
  surfaceSoft: "#EDF4FA",
  text: "#132238",
  textMuted: "#60758A",
  textSoft: "#334B63",
  border: "#D5E1EC",
  borderSoft: "rgba(71,85,105,0.14)",
  header: "#FFFFFF",
  navigation: "#FFFFFF",
  primary: "#D92D20",
  primarySoft: "rgba(217,45,32,0.10)",
  finance: "#0F9D8A",
  assets: "#D97706",
  solar: "#EA580C",
  success: "#15803D",
  warning: "#B45309",
  danger: "#DC2626",
  info: "#2563EB",
  overlay: "rgba(15,23,42,0.42)",
};

type ThemeContextValue = {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  palette: AppPalette;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isReady: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("dark");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(THEME_MODE_KEY)
      .then((stored) => {
        if (!active) return;
        if (stored === "system" || stored === "light" || stored === "dark") {
          setThemeModeState(stored);
        }
      })
      .catch(() => {
        if (active) setThemeModeState("dark");
      })
      .finally(() => {
        if (active) setIsReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    const previousMode = themeMode;
    setThemeModeState(mode);

    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, mode);
    } catch (error) {
      setThemeModeState(previousMode);
      throw error;
    }
  }, [themeMode]);

  const resolvedTheme: ResolvedTheme =
    themeMode === "system" ? (systemScheme === "light" ? "light" : "dark") : themeMode;

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      resolvedTheme,
      palette: resolvedTheme === "light" ? LIGHT_PALETTE : DARK_PALETTE,
      setThemeMode,
      isReady,
    }),
    [isReady, resolvedTheme, setThemeMode, themeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useAppTheme must be used inside ThemeProvider");
  return context;
}
