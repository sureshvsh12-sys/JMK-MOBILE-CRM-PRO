import { usePathname, useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS, RADIUS, SPACING } from "../constants/theme";
import BrandLogo from "./BrandLogo";

type DrawerItem = { title: string; icon: string; route: Href; matchPath: string };

const ITEMS: readonly DrawerItem[] = [
  { title: "Dashboard", icon: "⌂", route: "/dashboard", matchPath: "/dashboard" },
  { title: "Raw Contacts", icon: "☎", route: "/raw-contacts", matchPath: "/raw-contacts" },
  { title: "Leads", icon: "◎", route: "/leads", matchPath: "/leads" },
  { title: "Customers", icon: "♟", route: "/customers", matchPath: "/customers" },
  { title: "Follow-ups", icon: "✓", route: "/followups", matchPath: "/followups" },
  { title: "Properties", icon: "⌂", route: "/properties", matchPath: "/properties" },
  { title: "Bookings", icon: "▣", route: "/bookings", matchPath: "/bookings" },
  { title: "Finance", icon: "₹", route: "/finance", matchPath: "/finance" },
  { title: "Solar", icon: "☀", route: "/solar", matchPath: "/solar" },
  { title: "Employees", icon: "◉", route: "/employees", matchPath: "/employees" },
  { title: "Reports", icon: "▥", route: "/reports", matchPath: "/reports" },
  { title: "Search", icon: "⌕", route: "/search", matchPath: "/search" },
  { title: "Notifications", icon: "♢", route: "/notifications", matchPath: "/notifications" },
  { title: "Settings", icon: "⚙", route: "/settings", matchPath: "/settings" },
];

type AppDrawerProps = { onNavigate?: () => void };
const isRouteActive = (pathname: string, matchPath: string) => pathname === matchPath || pathname.startsWith(`${matchPath}/`);

export default function AppDrawer({ onNavigate }: AppDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  function navigateTo(item: DrawerItem) {
    onNavigate?.();
    if (!isRouteActive(pathname, item.matchPath)) router.push(item.route);
  }

  return (
    <View style={styles.container}>
      <View style={[styles.brandSection, { paddingTop: Math.max(insets.top, SPACING.lg) }]}>
        <BrandLogo background="dark" showGroupName={false} showTagline={false} width={88} />
        <View style={styles.brandCopy}>
          <Text style={styles.brandName}><Text style={styles.brandJ}>J</Text>MK GROUP</Text>
          <Text style={styles.brandTagline}>Trust • Growth • Future</Text>
          <Text style={styles.productName}>CRM PRO Enterprise</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.itemsContainer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]} showsVerticalScrollIndicator={false}>
        {ITEMS.map((item) => {
          const active = isRouteActive(pathname, item.matchPath);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.title}`}
              accessibilityState={{ selected: active }}
              key={item.title}
              onPress={() => navigateTo(item)}
              style={({ pressed }) => [styles.item, active && styles.activeItem, pressed && styles.pressed]}
            >
              <View style={[styles.iconContainer, active && styles.activeIconContainer]}><Text style={[styles.icon, active && styles.activeIcon]}>{item.icon}</Text></View>
              <Text style={[styles.title, active && styles.activeTitle]}>{item.title}</Text>
              <Text style={[styles.chevron, active && styles.activeChevron]}>›</Text>
            </Pressable>
          );
        })}

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>JMK GROUP</Text>
          <Text style={styles.footerText}>Finance • Assets • Solar</Text>
          <Text style={styles.footerDeveloper}>Developed By Suresh Vishwakarma</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  brandSection: {
    flexDirection: "row", alignItems: "center", gap: SPACING.lg,
    paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: "#08182A",
  },
  brandCopy: { flex: 1 },
  brandName: { color: COLORS.text, fontSize: 20, fontWeight: "900", letterSpacing: 0.7 },
  brandJ: { color: COLORS.primary },
  brandTagline: { marginTop: SPACING.xs, color: COLORS.textMuted, fontSize: 11, fontWeight: "600" },
  productName: { marginTop: 3, color: "#F87171", fontSize: 10, fontWeight: "800" },
  itemsContainer: { flexGrow: 1, padding: SPACING.lg, gap: 6 },
  item: {
    minHeight: 53, flexDirection: "row", alignItems: "center",
    paddingHorizontal: SPACING.md, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "transparent",
  },
  activeItem: { backgroundColor: COLORS.primarySoft, borderColor: "rgba(248,113,113,0.3)" },
  iconContainer: { width: 36, height: 36, alignItems: "center", justifyContent: "center", marginRight: SPACING.sm, borderRadius: RADIUS.sm, backgroundColor: COLORS.surfaceLight },
  activeIconContainer: { backgroundColor: "rgba(220,38,38,0.18)" },
  icon: { color: COLORS.textSoft, fontSize: 18, fontWeight: "900" },
  activeIcon: { color: "#FF6268" },
  title: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: "700" },
  activeTitle: { color: COLORS.white, fontWeight: "900" },
  chevron: { color: COLORS.textMuted, fontSize: 24, fontWeight: "400" },
  activeChevron: { color: COLORS.primary },
  footer: { marginTop: "auto", paddingTop: SPACING.xl, paddingBottom: SPACING.sm, alignItems: "center" },
  footerTitle: { color: COLORS.text, fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  footerText: { marginTop: 3, color: COLORS.textMuted, fontSize: 10, fontWeight: "600" },
  footerDeveloper: { marginTop: 5, color: COLORS.textMuted, fontSize: 9, fontWeight: "600" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
