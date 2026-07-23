import {
  Tabs,
  TabList,
  TabSlot,
  TabTrigger,
  type TabListProps,
  type TabTriggerSlotProps,
} from "expo-router/ui";
import { Pressable, StyleSheet, View, useColorScheme } from "react-native";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import {
  Colors,
  MaxContentWidth,
  Spacing,
  type ColorScheme,
} from "@/constants/theme";

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.tabSlot} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Dashboard</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Explore</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  ...pressableProps
}: TabTriggerSlotProps) {
  return (
    <Pressable
      {...pressableProps}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <ThemedView
        type={isFocused ? "backgroundSelected" : "backgroundElement"}
        style={styles.tabButtonView}
      >
        <ThemedText
          type="small"
          themeColor={isFocused ? "text" : "textSecondary"}
        >
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList({ children }: TabListProps) {
  const systemScheme = useColorScheme();
  const scheme: ColorScheme = systemScheme === "dark" ? "dark" : "light";
  const colors = Colors[scheme];

  return (
    <View style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <View style={styles.brandContainer}>
          <ThemedText type="smallBold" style={styles.brandText}>
            JMK GROUP
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Enterprise CRM
          </ThemedText>
        </View>

        <View style={styles.tabsContainer}>{children}</View>

        <View style={[styles.statusBadge, { borderColor: colors.tint }]}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Mobile CRM
          </ThemedText>
        </View>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabSlot: {
    height: "100%",
  },
  tabListContainer: {
    position: "absolute",
    width: "100%",
    padding: Spacing.three,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandContainer: {
    marginRight: "auto",
  },
  brandText: {
    fontWeight: "900",
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  statusBadge: {
    marginLeft: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderWidth: 1,
    borderRadius: Spacing.three,
  },
  pressable: {
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
