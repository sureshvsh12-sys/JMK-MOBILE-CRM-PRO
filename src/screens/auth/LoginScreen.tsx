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
import {
  createOwnerAccount,
  getAuthSession,
  hasAuthAccount,
  login,
} from "../../storage/authStorage";

export default function LoginScreen() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function prepareLogin() {
      const session = await getAuthSession();
      if (!active) return;

      if (session) {
        router.replace("/dashboard");
        return;
      }

      const accountExists = await hasAuthAccount();
      if (!active) return;

      setSetupMode(!accountExists);
      setChecking(false);
    }

    void prepareLogin();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit() {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (setupMode && !name.trim()) {
      Alert.alert("Name Required", "Owner name enter karein.");
      return;
    }

    if (!cleanEmail) {
      Alert.alert("Email Required", "Apna login email enter karein.");
      return;
    }

    if (!cleanPassword) {
      Alert.alert("Password Required", "Apna password enter karein.");
      return;
    }

    if (setupMode && cleanPassword !== confirmPassword.trim()) {
      Alert.alert("Password Mismatch", "Dono passwords same hone chahiye.");
      return;
    }

    setLoading(true);

    try {
      if (setupMode) {
        await createOwnerAccount({
          name: name.trim(),
          email: cleanEmail,
          password: cleanPassword,
        });
      } else {
        await login({ email: cleanEmail, password: cleanPassword });
      }

      router.replace("/dashboard");
    } catch (error) {
      Alert.alert(
        setupMode ? "Setup Failed" : "Login Failed",
        error instanceof Error ? error.message : "Please try again."
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
        <BrandLogo width={180} />

        <View style={styles.headingSection}>
          <Text style={styles.title}>
            {checking ? "Preparing CRM" : setupMode ? "Create Admin Account" : "Welcome Back"}
          </Text>
          <Text style={styles.subtitle}>JMK CRM PRO Enterprise</Text>
          {!checking ? (
            <Text style={styles.helperText}>
              {setupMode
                ? "First launch setup: owner account create karein."
                : "Apne registered account se secure login karein."}
            </Text>
          ) : null}
        </View>

        <View style={styles.formCard}>
          {setupMode ? (
            <>
              <Text style={styles.label}>Owner Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Full name"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="words"
                style={styles.input}
              />
            </>
          ) : null}

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="name@company.com"
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
            placeholder="Minimum 6 characters"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            textContentType={setupMode ? "newPassword" : "password"}
            style={styles.input}
          />

          {setupMode ? (
            <>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter password"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                textContentType="newPassword"
                style={styles.input}
              />
            </>
          ) : null}

          <PrimaryButton
            title={setupMode ? "Create Account & Continue" : "Login to JMK CRM"}
            onPress={() => void handleSubmit()}
            loading={loading || checking}
            disabled={checking}
          />

          <View style={styles.securityBox}>
            <Text style={styles.securityTitle}>Private Business Access</Text>
            <Text style={styles.securityText}>
              Demo credentials removed. Session login ke baad app restart par bhi active rahega.
            </Text>
          </View>
        </View>

        <View style={styles.segments}>
          <Text style={styles.finance}>Financial Servicess</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.assets}>Assets</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.solar}>Solar Solutions</Text>
        </View>

        <Text style={styles.developer}>Developed By Suresh Vishwakarma</Text>
        <Text style={styles.founder}>Founder, JMK Group</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: 42,
  },
  headingSection: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: "center",
  },
  title: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 7,
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  helperText: {
    marginTop: 9,
    maxWidth: 340,
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
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
  label: {
    marginBottom: 8,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
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
  securityBox: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(16,185,129,0.10)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.30)",
  },
  securityTitle: {
    marginBottom: 5,
    color: "#34D399",
    fontSize: 13,
    fontWeight: "800",
  },
  securityText: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
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
    color: COLORS.textMuted,
  },
  developer: {
    marginTop: 30,
    color: COLORS.textMuted,
    textAlign: "center",
    fontSize: 12,
  },
  founder: {
    marginTop: 4,
    color: COLORS.textMuted,
    textAlign: "center",
    fontSize: 11,
  },
});
