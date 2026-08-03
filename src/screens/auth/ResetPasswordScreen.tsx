import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
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
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import { supabase } from "../../services/supabase";
import { useAppTheme } from "../../context/ThemeContext";

type RecoveryState = "checking" | "ready" | "invalid";

function readRecoveryParameters(url: string) {
  try {
    const parsed = new URL(url);
    const query = new URLSearchParams(parsed.search);
    const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));

    return {
      accessToken: hash.get("access_token") ?? query.get("access_token"),
      refreshToken: hash.get("refresh_token") ?? query.get("refresh_token"),
      code: query.get("code") ?? hash.get("code"),
      errorDescription:
        query.get("error_description") ?? hash.get("error_description"),
    };
  } catch {
    return {
      accessToken: null,
      refreshToken: null,
      code: null,
      errorDescription: null,
    };
  }
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryState, setRecoveryState] =
    useState<RecoveryState>("checking");
  const [message, setMessage] = useState("Reset link verify ho raha hai...");
  const [saving, setSaving] = useState(false);

  const prepareRecoverySession = useCallback(async (incomingUrl?: string | null) => {
    try {
      const currentUrl =
        incomingUrl ||
        (Platform.OS === "web" && typeof window !== "undefined"
          ? window.location.href
          : await Linking.getInitialURL());

      if (currentUrl) {
        const parameters = readRecoveryParameters(currentUrl);

        if (parameters.errorDescription) {
          throw new Error(decodeURIComponent(parameters.errorDescription));
        }

        if (parameters.accessToken && parameters.refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: parameters.accessToken,
            refresh_token: parameters.refreshToken,
          });
          if (error) throw error;
        } else if (parameters.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(
            parameters.code
          );
          if (error) throw error;
        }
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (!data.session) {
        throw new Error(
          "Reset link expire ya invalid hai. Login screen se naya reset link bhejein."
        );
      }

      setRecoveryState("ready");
      setMessage("Naya secure password set karein.");
    } catch (error) {
      setRecoveryState("invalid");
      setMessage(
        error instanceof Error
          ? error.message
          : "Password reset session verify nahi ho saka."
      );
    }
  }, []);

  useEffect(() => {
    void prepareRecoverySession();

    const subscription = Linking.addEventListener("url", ({ url }) => {
      setRecoveryState("checking");
      setMessage("Reset link verify ho raha hai...");
      void prepareRecoverySession(url);
    });

    return () => subscription.remove();
  }, [prepareRecoverySession]);

  async function handleSavePassword() {
    if (recoveryState !== "ready") return;

    if (password.length < 8) {
      Alert.alert(
        "Weak Password",
        "Password kam se kam 8 characters ka rakhein."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "New Password aur Confirm Password same hone chahiye."
      );
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      await supabase.auth.signOut();

      Alert.alert(
        "Password Updated",
        "Password successfully change ho gaya. Ab naye password se login karein.",
        [{ text: "Login", onPress: () => router.replace("/login") }]
      );
    } catch (error) {
      Alert.alert(
        "Update Failed",
        error instanceof Error
          ? error.message
          : "Password update nahi ho saka."
      );
    } finally {
      setSaving(false);
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
          <BrandLogo width={176} showTagline background={palette.mode === "dark" ? "dark" : "light"} />
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.securityIcon}>
            <Text style={styles.securityIconText}>✓</Text>
          </View>

          <Text style={[styles.title, { color: palette.text }]}>Create New Password</Text>
          <Text style={[styles.subtitle, { color: palette.textMuted }]}>{message}</Text>

          {recoveryState === "checking" ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[styles.loadingText, { color: palette.textMuted }]}>Please wait...</Text>
            </View>
          ) : null}

          {recoveryState === "invalid" ? (
            <View style={styles.invalidBox}>
              <Text style={styles.invalidTitle}>Reset Link Invalid</Text>
              <Text style={[styles.invalidText, { color: palette.textMuted }]}>{message}</Text>
              <Pressable
                onPress={() => router.replace("/login")}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { backgroundColor: palette.surfaceSoft, borderColor: palette.border },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.secondaryButtonText, { color: palette.text }]}>Back to Login</Text>
              </Pressable>
            </View>
          ) : null}

          {recoveryState === "ready" ? (
            <>
              <Text style={[styles.label, { color: palette.text }]}>New Password</Text>
              <View style={[styles.passwordField, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minimum 8 characters"
                  placeholderTextColor={palette.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  selectionColor={palette.primary}
                  cursorColor={palette.primary}
                  style={[styles.passwordInput, { color: palette.text }]}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowPassword((current) => !current)}
                  style={styles.showButton}
                >
                  <Text style={styles.showButtonText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.label, { color: palette.text }]}>Confirm Password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Password dobara enter karein"
                placeholderTextColor={palette.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                onSubmitEditing={() => void handleSavePassword()}
                selectionColor={palette.primary}
                cursorColor={palette.primary}
                style={[styles.input, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]}
              />

              <Text style={[styles.passwordHint, { color: palette.textMuted }]}>
                Strong password me uppercase, lowercase, number aur special
                character use karein.
              </Text>

              <Pressable
                accessibilityRole="button"
                disabled={saving}
                onPress={() => void handleSavePassword()}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (pressed || saving) && styles.pressed,
                ]}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Save New Password</Text>
                )}
              </Pressable>
            </>
          ) : null}
        </View>
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
    paddingVertical: 40,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  securityIcon: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(5,150,105,0.12)",
    borderWidth: 1,
    borderColor: "rgba(5,150,105,0.30)",
  },
  securityIconText: {
    color: COLORS.success,
    fontSize: 26,
    fontWeight: "900",
  },
  title: {
    marginTop: SPACING.lg,
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  loadingBox: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  invalidBox: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(220,38,38,0.07)",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.24)",
  },
  invalidTitle: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: "900",
  },
  invalidText: {
    marginTop: SPACING.sm,
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 19,
  },
  label: {
    marginBottom: SPACING.sm,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  input: {
    minHeight: 52,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.text,
    fontSize: 15,
  },
  passwordField: {
    minHeight: 52,
    marginBottom: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceLight,
  },
  passwordInput: {
    flex: 1,
    minHeight: 50,
    paddingLeft: SPACING.lg,
    color: COLORS.text,
    fontSize: 15,
  },
  showButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  showButtonText: {
    color: COLORS.info,
    fontSize: 12,
    fontWeight: "900",
  },
  passwordHint: {
    marginTop: -4,
    marginBottom: SPACING.lg,
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 17,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 46,
    marginTop: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});
