import {
  useEffect,
} from "react";

import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useRouter,
} from "expo-router";

import type {
  Href,
} from "expo-router";

import BrandLogo from "../components/BrandLogo";

import {
  COLORS,
  SPACING,
} from "../constants/theme";

const LOGIN_ROUTE = "/login" satisfies Href;

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(LOGIN_ROUTE);
    }, 2200);

    return () => {
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <BrandLogo
        size={142}
        showTagline={false}
      />

      <Text style={styles.enterprise}>
        CRM PRO Enterprise
      </Text>

      <View style={styles.segmentContainer}>
        <Text style={styles.finance}>
          JMK Financial Servicess
        </Text>

        <Text style={styles.assets}>
          JMK Assets
        </Text>

        <Text style={styles.solar}>
          JMK Solar Solutions
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.tagline}>
          Trust • Growth • Future
        </Text>

        <Text style={styles.loading}>
          Secure CRM Loading...
        </Text>
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
    backgroundColor: COLORS.background,
  },

  enterprise: {
    marginTop: 14,
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  segmentContainer: {
    marginTop: 35,
    alignItems: "center",
    gap: 10,
  },

  finance: {
    color: COLORS.finance,
    fontSize: 15,
    fontWeight: "700",
  },

  assets: {
    color: COLORS.assets,
    fontSize: 15,
    fontWeight: "700",
  },

  solar: {
    color: COLORS.solar,
    fontSize: 15,
    fontWeight: "700",
  },

  footer: {
    position: "absolute",
    right: 0,
    bottom: 40,
    left: 0,
    alignItems: "center",
  },

  tagline: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },

  loading: {
    marginTop: 9,
    color: "#475569",
    fontSize: 12,
  },
});