import {
    useEffect,
    useRef,
    useState,
} from "react";

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

import {
    useRouter,
} from "expo-router";

import type {
    Href,
} from "expo-router";

import BrandLogo from "../../components/BrandLogo";
import PrimaryButton from "../../components/PrimaryButton";

import {
    COLORS,
    RADIUS,
    SPACING,
} from "../../constants/theme";

const DASHBOARD_ROUTE = "/dashboard" satisfies Href;

export default function LoginScreen() {
  const router = useRouter();
  const loginTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (loginTimerRef.current) {
        clearTimeout(loginTimerRef.current);
      }
    };
  }, []);

  const [email, setEmail] = useState(
    "admin@jmkgroup.in"
  );

  const [password, setPassword] =
    useState("123456");

  const [loading, setLoading] =
    useState(false);

  function handleLogin() {
    const cleanEmail = email
      .trim()
      .toLowerCase();

    if (!cleanEmail) {
      Alert.alert(
        "Email Required",
        "Apna login email enter karein."
      );

      return;
    }

    if (!password.trim()) {
      Alert.alert(
        "Password Required",
        "Apna password enter karein."
      );

      return;
    }

    setLoading(true);

    loginTimerRef.current = setTimeout(() => {
      setLoading(false);
      loginTimerRef.current = null;
      router.replace(DASHBOARD_ROUTE);
    }, 700);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BrandLogo size={104} />

        <View style={styles.headingSection}>
          <Text style={styles.title}>
            Welcome Back
          </Text>

          <Text style={styles.subtitle}>
            JMK CRM PRO Enterprise
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>
            Email Address
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="admin@jmkgroup.in"
            placeholderTextColor={
              COLORS.textMuted
            }
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor={
              COLORS.textMuted
            }
            secureTextEntry
            style={styles.input}
          />

          <PrimaryButton
            title="Login to JMK CRM"
            onPress={handleLogin}
            loading={loading}
          />

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>
              Demo Login
            </Text>

            <Text style={styles.demoText}>
              Email: admin@jmkgroup.in
            </Text>

            <Text style={styles.demoText}>
              Password: 123456
            </Text>
          </View>
        </View>

        <View style={styles.segments}>
          <Text style={styles.finance}>
            Financial Servicess
          </Text>

          <Text style={styles.separator}>
            •
          </Text>

          <Text style={styles.assets}>
            Assets
          </Text>

          <Text style={styles.separator}>
            •
          </Text>

          <Text style={styles.solar}>
            Solar Solutions
          </Text>
        </View>

        <Text style={styles.developer}>
          Developed By Suresh Vishwakarma
        </Text>

        <Text style={styles.founder}>
          Founder, JMK Group
        </Text>
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
  },

  subtitle: {
    marginTop: 7,
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "700",
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

  demoBox: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(37,99,235,0.12)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.35)",
  },

  demoTitle: {
    marginBottom: 5,
    color: "#60A5FA",
    fontSize: 13,
    fontWeight: "800",
  },

  demoText: {
    color: COLORS.textMuted,
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