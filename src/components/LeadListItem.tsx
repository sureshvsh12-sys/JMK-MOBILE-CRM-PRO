import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import AppButton from "./AppButton";
import StatusBadge, { type StatusTone } from "./StatusBadge";
import { COLORS, RADIUS, SHADOW, SPACING, getSegmentColor } from "../constants/theme";
import type { Lead } from "../types/lead";

type LeadListItemProps = { lead: Lead; onPress: () => void; onStagePress?: () => void };

const STAGE_TONES: Partial<Record<Lead["stage"], StatusTone>> = {
  "New Lead": "blue", Contacted: "purple", "Site Visit": "amber", Negotiation: "amber",
  Booking: "assets", Registry: "finance", Completed: "green", Lost: "red",
};

export default function LeadListItem({ lead, onPress, onStagePress }: LeadListItemProps) {
  const segmentColor = getSegmentColor(lead.segment);
  const phone = String(lead.mobile || "").replace(/\D/g, "");
  const whatsapp = phone.length === 10 ? `91${phone}` : phone;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.accent, { backgroundColor: segmentColor }]} />
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: `${segmentColor}20`, borderColor: `${segmentColor}66` }]}>
          <Text style={[styles.avatarText, { color: segmentColor }]}>{(lead.customer || "L").charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.main}>
          <Text numberOfLines={1} style={styles.name}>{lead.customer || "Unnamed Lead"}</Text>
          <Text style={styles.mobile}>{lead.mobile || "No mobile"}</Text>
        </View>
        <StatusBadge label={lead.priority} tone={lead.priority === "High" ? "red" : lead.priority === "Low" ? "green" : "amber"} />
      </View>

      <Text numberOfLines={1} style={styles.requirement}>{lead.property || "Requirement not added"}</Text>
      <Text numberOfLines={1} style={styles.location}>📍 {lead.location || "Location not added"}</Text>

      <View style={styles.tags}>
        <Pressable onPress={(event) => { event.stopPropagation(); onStagePress?.(); }}>
          <StatusBadge label={`${lead.stage} ▾`} tone={STAGE_TONES[lead.stage] ?? "blue"} />
        </Pressable>
        <StatusBadge label={lead.temperature} tone={lead.temperature === "Hot" ? "red" : lead.temperature === "Cold" ? "blue" : "amber"} />
        <StatusBadge label={lead.segment === "finance" ? "Finance" : lead.segment === "solar" ? "Solar" : "Assets"} tone={lead.segment} />
      </View>

      <View style={styles.footer}>
        <View style={styles.valueWrap}>
          <Text style={styles.valueLabel}>Lead Value</Text>
          <Text style={styles.value}>₹{Number(lead.value || 0).toLocaleString("en-IN")}</Text>
        </View>
        <View style={styles.actions}>
          <AppButton compact label="Call" variant="call" onPress={() => phone && void Linking.openURL(`tel:${phone}`)} />
          <AppButton compact label="WhatsApp" variant="whatsapp" onPress={() => whatsapp && void Linking.openURL(`https://wa.me/${whatsapp}`)} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { position: "relative", overflow: "hidden", padding: SPACING.lg, borderRadius: RADIUS.lg, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, ...SHADOW },
  accent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  topRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  avatar: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 23, borderWidth: 1 },
  avatarText: { fontSize: 18, fontWeight: "900" },
  main: { flex: 1, minWidth: 0 },
  name: { color: COLORS.text, fontSize: 16, fontWeight: "900" },
  mobile: { marginTop: 4, color: COLORS.textMuted, fontSize: 12, fontWeight: "700" },
  requirement: { marginTop: SPACING.md, color: COLORS.text, fontSize: 13, fontWeight: "800" },
  location: { marginTop: 5, color: COLORS.textMuted, fontSize: 11 },
  tags: { marginTop: SPACING.md, flexDirection: "row", flexWrap: "wrap", gap: 7 },
  footer: { marginTop: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.borderSoft, flexDirection: "row", alignItems: "center", gap: SPACING.md },
  valueWrap: { flex: 1 },
  valueLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: "800", textTransform: "uppercase" },
  value: { marginTop: 3, color: COLORS.success, fontSize: 15, fontWeight: "900" },
  actions: { flexDirection: "row", gap: 7 },
});
