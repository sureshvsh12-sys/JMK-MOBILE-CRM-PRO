import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import BrandLogo from "../components/BrandLogo";
import { COLORS, SPACING } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { initializeDatabase } from "../storage/database";

export default function SplashScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    let active = true;

    async function openApp() {
      await initializeDatabase();
      if (!active || loading) return;
      router.replace(session ? "/dashboard" : "/login");
    }

    const timer = setTimeout(() => void openApp(), 700);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [loading, router, session]);

  return (
    <View style={styles.container}>
      <BrandLogo width={210} showTagline={false} />
      <Text style={styles.enterprise}>CRM PRO Enterprise</Text>
      <View style={styles.segmentContainer}>
        <Text style={styles.finance}>JMK Financial Servicess</Text>
        <Text style={styles.assets}>JMK Assets</Text>
        <Text style={styles.solar}>JMK Solar Solutions</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.tagline}>Trust • Growth • Future</Text>
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        <Text style={styles.loading}>Secure cloud session loading...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: SPACING.xl, backgroundColor: COLORS.background },
  enterprise: { marginTop: 14, color: COLORS.primary, fontSize: 18, fontWeight: "800", letterSpacing: 0.5 },
  segmentContainer: { marginTop: 35, alignItems: "center", gap: 10 },
  finance: { color: COLORS.finance, fontSize: 15, fontWeight: "700" },
  assets: { color: COLORS.assets, fontSize: 15, fontWeight: "700" },
  solar: { color: COLORS.solar, fontSize: 15, fontWeight: "700" },
  footer: { position: "absolute", right: 0, bottom: 40, left: 0, alignItems: "center" },
  tagline: { color: COLORS.textMuted, fontSize: 14, fontWeight: "700" },
  loader: { marginTop: 14 },
  loading: { marginTop: 8, color: "#64748B", fontSize: 12 },
});
