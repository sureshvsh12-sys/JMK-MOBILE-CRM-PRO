import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import AppErrorBoundary from "../components/AppErrorBoundary";
import { COLORS } from "../constants/theme";

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <StatusBar style="light" backgroundColor="#06111F" />
      <Stack
        screenOptions={{
          animation: "slide_from_right",
          animationDuration: 220,
          contentStyle: { backgroundColor: COLORS.background },
          headerShown: false,
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      >
        <Stack.Screen name="index" options={{ animation: "fade" }} />
        <Stack.Screen name="login" options={{ animation: "fade", gestureEnabled: false }} />
        <Stack.Screen name="dashboard" options={{ animation: "fade" }} />
        <Stack.Screen name="leads" />
        <Stack.Screen name="lead-form" />
        <Stack.Screen name="customers" />
        <Stack.Screen name="customer-form" />
        <Stack.Screen name="customer-360" />
        <Stack.Screen name="customer-documents" />
        <Stack.Screen name="followups" />
        <Stack.Screen name="followup-form" />
        <Stack.Screen name="bookings" />
        <Stack.Screen name="booking-form" />
        <Stack.Screen name="booking-payments" />
        <Stack.Screen name="booking-payment-form" />
        <Stack.Screen name="booking-installments" />
        <Stack.Screen name="booking-installment-form" />
        <Stack.Screen name="finance" />
        <Stack.Screen name="finance-entry" />
        <Stack.Screen name="solar" />
        <Stack.Screen name="solar-form" />
        <Stack.Screen name="employees" />
        <Stack.Screen name="reports" />
        <Stack.Screen name="search" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="explore" />
      </Stack>
    </AppErrorBoundary>
  );
}
