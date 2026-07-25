import React, { Component, type ErrorInfo, type PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, RADIUS, SPACING } from "../constants/theme";

type State = {
  hasError: boolean;
};

export default class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("JMK Mobile CRM screen error", error, info.componentStack);
  }

  private resetAppView = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.badge}>JMK CRM</Text>
          <Text style={styles.title}>Screen open nahi ho saki</Text>
          <Text style={styles.description}>
            Aapka CRM data safe hai. Screen ko dobara load karein. Problem repeat ho to app restart karein.
          </Text>
          <Pressable style={styles.button} onPress={this.resetAppView}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    color: COLORS.white,
    backgroundColor: COLORS.primary,
    fontSize: 11,
    fontWeight: "900",
  },
  title: {
    marginTop: SPACING.lg,
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
  },
  description: {
    marginTop: SPACING.sm,
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  button: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
  },
});
