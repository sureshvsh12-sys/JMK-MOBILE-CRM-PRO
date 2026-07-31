import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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

export default function LoginScreen() {
  const router = useRouter();
  const { session, loading: authLoading, configured, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
        error instanceof Error ? error.message : "Email ya password sahi nahi hai."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BrandLogo width={210} showTagline />

        <View style={styles.headingSection}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>JMK CRM PRO Enterprise</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="admin@jmkgroup.in"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            textContentType="password"
            onSubmitEditing={() => void handleLogin()}
            style={styles.input}
          />

          <PrimaryButton
            title="Login to JMK CRM"
            onPress={() => void handleLogin()}
            loading={loading || authLoading}
          />

          {!configured ? (
            <View style={styles.setupBox}>
              <Text style={styles.setupTitle}>Supabase Setup Required</Text>
              <Text style={styles.setupText}>
                .env file me EXPO_PUBLIC_SUPABASE_URL aur
                EXPO_PUBLIC_SUPABASE_ANON_KEY set karein.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.segments}>
          <Text style={styles.finance}>Financial Servicess</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.assets}>Assets</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.solar}>Solar Solutions</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: 42,
  },
  headingSection: { marginTop: SPACING.xl, marginBottom: SPACING.xl, alignItems: "center" },
  title: { color: COLORS.white, fontSize: 28, fontWeight: "900" },
  subtitle: { marginTop: 7, color: COLORS.primary, fontSize: 16, fontWeight: "700" },
  formCard: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: { marginBottom: 8, color: COLORS.text, fontSize: 14, fontWeight: "700" },
  input: {
    minHeight: 52,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.white,
    fontSize: 15,
  },
  setupBox: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(245,158,11,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
  },
  setupTitle: { marginBottom: 5, color: "#FBBF24", fontSize: 13, fontWeight: "800" },
  setupText: { color: COLORS.textMuted, fontSize: 12, lineHeight: 19 },
  segments: {
    marginTop: SPACING.xl,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  finance: { color: COLORS.finance, fontWeight: "800" },
  assets: { color: COLORS.assets, fontWeight: "800" },
  solar: { color: COLORS.solar, fontWeight: "800" },
  separator: { color: COLORS.textMuted },
});
