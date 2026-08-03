import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import BrandLogo from "../../components/BrandLogo";
import PrimaryButton from "../../components/PrimaryButton";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useAppTheme } from "../../context/ThemeContext";
import { supabase } from "../../services/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const { session, loading: authLoading, configured, signIn } = useAuth();
  const { palette, resolvedTheme } = useAppTheme();

  const [email, setEmail] = useState("suresh.vsh12@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && session) {
      router.replace("/dashboard");
    }
  }, [authLoading, router, session]);

  async function handleLogin() {
    const cleanEmail = email.trim().toLowerCase();

    if (!configured) {
      Alert.alert(
        "Supabase Setup Required",
        "Project root me .env file bana kar Supabase URL aur anon key set karein."
      );
      return;
    }

    if (!cleanEmail) {
      Alert.alert("Email Required", "Apna login email enter karein.");
      return;
    }

    if (!password) {
      Alert.alert("Password Required", "Apna password enter karein.");
      return;
    }

    setLoading(true);

    try {
      await signIn(cleanEmail, password);
      router.replace("/dashboard");
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error instanceof Error
          ? error.message
          : "Email ya password sahi nahi hai."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    const cleanEmail = email.trim().toLowerCase();

    if (!configured) {
      Alert.alert(
        "Supabase Setup Required",
        "Project root me .env file bana kar Supabase URL aur anon key set karein."
      );
      return;
    }

    if (!cleanEmail) {
      Alert.alert(
        "Email Required",
        "Password reset ke liye email enter karein."
      );
      return;
    }

    setResetLoading(true);

    try {
      const redirectTo =
        Platform.OS === "web" && typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : "jmkmobile://reset-password";

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });

      if (error) {
        throw error;
      }

      Alert.alert(
        "Reset Email Sent",
        `Password reset link ${cleanEmail} par bhej diya gaya hai. Inbox aur Spam folder check karein.`
      );
    } catch (error) {
      Alert.alert(
        "Reset Failed",
        error instanceof Error
          ? error.message
          : "Password reset email send nahi ho saka."
      );
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: palette.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <BrandLogo
            width={210}
            showGroupName
            showTagline
            background={resolvedTheme}
          />
        </View>

        <View style={styles.headingSection}>
          <Text style={[styles.title, { color: palette.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: palette.primary }]}>JMK CRM PRO Enterprise</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.label, { color: palette.text }]}>Email Address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="suresh.vsh12@gmail.com"
            placeholderTextColor={palette.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            autoComplete="email"
            selectionColor={palette.primary}
            cursorColor={palette.primary}
            style={[styles.input, { backgroundColor: palette.surfaceRaised, borderColor: palette.border, color: palette.text }]}
          />

          <Text style={[styles.label, { color: palette.text }]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor={palette.textMuted}
            secureTextEntry
            textContentType="password"
            autoComplete="password"
            selectionColor={palette.primary}
            cursorColor={palette.primary}
            onSubmitEditing={() => void handleLogin()}
            style={[styles.input, { backgroundColor: palette.surfaceRaised, borderColor: palette.border, color: palette.text }]}
          />

          <Pressable
            accessibilityRole="button"
            disabled={resetLoading}
            onPress={() => void handleForgotPassword()}
            style={({ pressed }) => [
              styles.forgotButton,
              pressed && styles.forgotButtonPressed,
            ]}
          >
            <Text style={[styles.forgotText, { color: palette.primary }]}>
              {resetLoading ? "Sending reset link..." : "Forgot Password?"}
            </Text>
          </Pressable>

          <PrimaryButton
            title="Login to JMK CRM"
            onPress={() => void handleLogin()}
            loading={loading || authLoading}
          />

          {!configured ? (
            <View style={[styles.setupBox, { backgroundColor: palette.surfaceSoft, borderColor: palette.warning }]}>
              <Text style={[styles.setupTitle, { color: palette.warning }]}>Supabase Setup Required</Text>
              <Text style={[styles.setupText, { color: palette.textMuted }]}>
                .env file me EXPO_PUBLIC_SUPABASE_URL aur
                EXPO_PUBLIC_SUPABASE_ANON_KEY set karein.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.segments}>
          <Text style={[styles.finance, { color: palette.finance }]}>Financial Servicess</Text>
          <Text style={[styles.separator, { color: palette.textMuted }]}>•</Text>
          <Text style={[styles.assets, { color: palette.assets }]}>Assets</Text>
          <Text style={[styles.separator, { color: palette.textMuted }]}>•</Text>
          <Text style={[styles.solar, { color: palette.solar }]}>Solar Solutions</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3F8",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: 42,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  headingSection: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: "center",
  },
  title: {
    color: "#102033",
    fontSize: 28,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 7,
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  formCard: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D7E1EC",
  },
  label: {
    marginBottom: 8,
    color: "#102033",
    fontSize: 14,
    fontWeight: "800",
  },
  input: {
    minHeight: 52,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "600",
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -8,
    marginBottom: SPACING.lg,
    paddingVertical: 6,
  },
  forgotButtonPressed: {
    opacity: 0.65,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  setupBox: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(245,158,11,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
  },
  setupTitle: {
    marginBottom: 5,
    color: "#B45309",
    fontSize: 13,
    fontWeight: "800",
  },
  setupText: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 19,
  },
  segments: {
    marginTop: SPACING.xl,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  finance: {
    color: COLORS.finance,
    fontWeight: "800",
  },
  assets: {
    color: COLORS.assets,
    fontWeight: "800",
  },
  solar: {
    color: COLORS.solar,
    fontWeight: "800",
  },
  separator: {
    color: "#64748B",
  },
});
