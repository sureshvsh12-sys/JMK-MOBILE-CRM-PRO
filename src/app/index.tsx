import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import BrandLogo from "../components/BrandLogo";
import { RADIUS, SPACING } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { initializeDatabase } from "../storage/database";

export default function SplashScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const { palette, isReady } = useAppTheme();
  const [startupError, setStartupError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function openApp() {
      if (loading || !isReady) return;

      setStartupError(null);

      try {
        await initializeDatabase();
        if (!active) return;

        timer = setTimeout(() => {
          if (active) {
            router.replace(session ? "/dashboard" : "/login");
          }
        }, 450);
      } catch (error) {
        if (!active) return;
        setStartupError(
          error instanceof Error
            ? error.message
            : "Local CRM database initialize nahi ho saki."
        );
      }
    }

    void openApp();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [isReady, loading, retryKey, router, session]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}> 
      <BrandLogo
        width={210}
        showGroupName
        showTagline={false}
        background={palette.mode}
      />

      <Text style={[styles.enterprise, { color: palette.primary }]}> 
        CRM PRO Enterprise
      </Text>

      <View style={styles.segmentContainer}>
        <Text style={[styles.segment, { color: palette.finance }]}> 
          JMK Financial Servicess
        </Text>
        <Text style={[styles.segment, { color: palette.assets }]}>JMK Assets</Text>
        <Text style={[styles.segment, { color: palette.solar }]}> 
          JMK Solar Solutions
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.tagline, { color: palette.textMuted }]}> 
          Trust • Growth • Future
        </Text>

        {startupError ? (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={[styles.errorTitle, { color: palette.danger }]}> 
              App start nahi ho saki
            </Text>
            <Text style={[styles.errorMessage, { color: palette.textMuted }]}> 
              {startupError}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry app startup"
              onPress={() => setRetryKey((current) => current + 1)}
              style={({ pressed }) => [
                styles.retryButton,
                { backgroundColor: palette.primary },
                pressed && styles.retryButtonPressed,
              ]}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ActivityIndicator color={palette.primary} style={styles.loader} />
            <Text style={[styles.loading, { color: palette.textMuted }]}> 
              Secure cloud session loading...
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  enterprise: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  segmentContainer: {
    marginTop: 35,
    alignItems: "center",
    gap: 10,
  },
  segment: {
    fontSize: 15,
    fontWeight: "700",
  },
  footer: {
    position: "absolute",
    right: SPACING.xl,
    bottom: 34,
    left: SPACING.xl,
    alignItems: "center",
  },
  tagline: {
    fontSize: 14,
    fontWeight: "700",
  },
  loader: {
    marginTop: 14,
  },
  loading: {
    marginTop: 8,
    fontSize: 12,
  },
  errorCard: {
    width: "100%",
    maxWidth: 420,
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  errorMessage: {
    marginTop: SPACING.sm,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  retryButton: {
    minWidth: 130,
    minHeight: 44,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
  },
  retryButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
});
