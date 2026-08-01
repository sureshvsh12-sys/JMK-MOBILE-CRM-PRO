import React, { Component, type ErrorInfo, type PropsWithChildren } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS, RADIUS, SPACING } from "../constants/theme";

type State = {
  hasError: boolean;
  errorMessage: string;
  errorId: string;
  attempts: number;
};

function createErrorId() {
  return `JMK-${Date.now().toString(36).toUpperCase()}`;
}

export default class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = {
    hasError: false,
    errorMessage: "",
    errorId: "",
    attempts: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      errorMessage: error.message || "Unknown application error",
      errorId: createErrorId(),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("JMK Mobile CRM screen error", {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  private resetAppView = () => {
    this.setState((current) => ({
      hasError: false,
      errorMessage: "",
      errorId: "",
      attempts: current.attempts + 1,
    }));
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const showTechnicalDetail = __DEV__ || Platform.OS === "web";

    return (
      <View style={styles.container}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.brandRow}>
              <View style={styles.logoMark}>
                <Text style={styles.logoJ}>J</Text>
                <Text style={styles.logoMk}>MK</Text>
              </View>
              <Text style={styles.groupText}>GROUP</Text>
            </View>

            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>!</Text>
            </View>

            <Text style={styles.title}>Screen open nahi ho saki</Text>
            <Text style={styles.description}>
              Aapka CRM data safe hai. Screen ko dobara load karein. Agar problem repeat ho, app restart karke System Health Check run karein.
            </Text>

            <View style={styles.referenceBox}>
              <Text style={styles.referenceLabel}>ERROR REFERENCE</Text>
              <Text selectable style={styles.referenceValue}>
                {this.state.errorId || "JMK-UNKNOWN"}
              </Text>
            </View>

            {showTechnicalDetail && this.state.errorMessage ? (
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Technical detail</Text>
                <Text selectable style={styles.detailText}>
                  {this.state.errorMessage}
                </Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={this.resetAppView}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </Pressable>

            {this.state.attempts > 1 ? (
              <Text style={styles.retryHint}>
                Screen {this.state.attempts} baar retry hui. App restart karna recommended hai.
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  card: {
    width: "100%",
    maxWidth: 460,
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logoMark: { flexDirection: "row", alignItems: "center" },
  logoJ: { color: COLORS.primary, fontSize: 18, fontWeight: "900" },
  logoMk: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  groupText: {
    marginLeft: 6,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  iconCircle: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.xl,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.45)",
    backgroundColor: COLORS.primarySoft,
  },
  iconText: { color: COLORS.primary, fontSize: 30, fontWeight: "900" },
  title: {
    marginTop: SPACING.lg,
    color: COLORS.text,
    fontSize: 23,
    fontWeight: "900",
  },
  description: {
    marginTop: SPACING.sm,
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  referenceBox: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },
  referenceLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  referenceValue: {
    marginTop: 5,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  detailBox: {
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    backgroundColor: COLORS.background,
  },
  detailLabel: { color: COLORS.warning, fontSize: 10, fontWeight: "900" },
  detailText: {
    marginTop: 5,
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 15,
  },
  button: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
  },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  buttonText: { color: COLORS.white, fontSize: 13, fontWeight: "900" },
  retryHint: {
    marginTop: SPACING.md,
    color: COLORS.warning,
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
  },
});
