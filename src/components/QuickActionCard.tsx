import { Pressable, StyleSheet, Text, View } from "react-native";

import { RADIUS, SPACING } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";

type QuickActionCardProps = { title: string; subtitle?: string; icon: string; accentColor?: string; onPress: () => void };

export default function QuickActionCard({ title, subtitle, icon, accentColor, onPress }: QuickActionCardProps) {
  const { palette } = useAppTheme();
  const accent = accentColor ?? palette.primary;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { backgroundColor: palette.surface, borderColor: palette.border }, pressed && styles.pressed]}>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={[styles.iconContainer, { backgroundColor: `${accent}16`, borderColor: `${accent}4D` }]}><Text style={styles.icon}>{icon}</Text></View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: palette.textMuted }]} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.arrowCircle, { backgroundColor: `${accent}14` }]}><Text style={[styles.arrow, { color: accent }]}>›</Text></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 82, flexDirection: "row", alignItems: "center", padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, overflow: "hidden" },
  accentBar: { position: "absolute", left: 0, top: 12, bottom: 12, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  iconContainer: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.md, borderWidth: 1, marginLeft: 4 },
  icon: { fontSize: 22 },
  content: { flex: 1, marginHorizontal: SPACING.md },
  title: { fontSize: 14, fontWeight: "900" },
  subtitle: { marginTop: 4, fontSize: 11, lineHeight: 16, fontWeight: "500" },
  arrowCircle: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  arrow: { marginTop: -2, fontSize: 28, lineHeight: 30, fontWeight: "500" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
