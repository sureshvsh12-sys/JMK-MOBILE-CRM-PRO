import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import AppButton from "../AppButton";
import StatusBadge, { type StatusTone } from "../StatusBadge";
import {
  COLORS,
  RADIUS,
  SHADOW,
  SPACING,
  getSegmentColor,
} from "../../constants/theme";
import type { Customer } from "../../types/customer";

type Props = {
  customer: Customer;
  onEdit: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "C";
}

function segmentTone(segment: string): StatusTone {
  const normalized = segment.toLowerCase();
  if (normalized.includes("finance")) return "finance";
  if (normalized.includes("solar")) return "solar";
  return "assets";
}

export default function CustomerProfileCard({
  customer,
  onEdit,
  onCall,
  onWhatsApp,
}: Props) {
  const accent = getSegmentColor(customer.segment);

  return (
    <View style={styles.card}>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />

      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: accent, shadowColor: accent }]}>
          <Text style={styles.avatarText}>{initials(customer.name)}</Text>
        </View>

        <View style={styles.identity}>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.mobile}>{customer.mobile}</Text>
          <View style={styles.badgeRow}>
            <StatusBadge label={customer.segment} tone={segmentTone(customer.segment)} />
            {customer.status ? (
              <StatusBadge label={customer.status} tone="blue" solid={false} />
            ) : null}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit customer"
          style={({ pressed }) => [
            styles.editButton,
            { backgroundColor: `${accent}16`, borderColor: `${accent}55` },
            pressed && styles.pressed,
          ]}
          onPress={onEdit}
        >
          <Text style={[styles.editText, { color: accent }]}>Edit</Text>
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <AppButton compact label="Call" variant="call" onPress={onCall} />
        <AppButton compact label="WhatsApp" variant="whatsapp" onPress={onWhatsApp} />
        {customer.email ? (
          <AppButton
            compact
            label="Email"
            variant="secondary"
            onPress={() => void Linking.openURL(`mailto:${customer.email}`)}
          />
        ) : null}
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsGrid}>
        <Detail label="City" value={customer.city || "Not added"} />
        <Detail label="Occupation" value={customer.occupation || "Not added"} />
        <Detail label="Source" value={customer.source || "Mobile App"} />
        <Detail label="Assigned To" value={customer.assignedTo || "Admin"} />
      </View>

      {customer.address ? (
        <View style={styles.fullDetail}>
          <Text style={styles.detailLabel}>ADDRESS</Text>
          <Text style={styles.detailValue}>{customer.address}</Text>
        </View>
      ) : null}

      {customer.notes ? (
        <View style={styles.notesCard}>
          <Text style={styles.detailLabel}>CUSTOMER NOTES</Text>
          <Text style={styles.notes}>{customer.notes}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailCard}>
      <Text style={styles.detailLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    overflow: "hidden",
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    ...SHADOW,
  },
  accentBar: { position: "absolute", top: 0, left: 0, bottom: 0, width: 5 },
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.md },
  avatar: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 31,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarText: { color: COLORS.white, fontSize: 20, fontWeight: "900" },
  identity: { flex: 1, minWidth: 0 },
  name: { color: COLORS.text, fontSize: 21, fontWeight: "900" },
  mobile: { marginTop: 4, color: COLORS.textMuted, fontSize: 12, fontWeight: "700" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: SPACING.sm },
  editButton: {
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 13,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  editText: { fontSize: 11, fontWeight: "900" },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginTop: SPACING.lg },
  divider: { height: 1, marginVertical: SPACING.lg, backgroundColor: COLORS.border },
  detailsGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  detailCard: {
    flexGrow: 1,
    flexBasis: 135,
    minHeight: 66,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  fullDetail: {
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
  },
  detailLabel: { color: COLORS.textMuted, fontSize: 8.5, fontWeight: "900", letterSpacing: 1 },
  detailValue: { marginTop: 5, color: COLORS.text, fontSize: 12, fontWeight: "800", lineHeight: 18 },
  notesCard: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: "#FFF8E8",
    borderWidth: 1,
    borderColor: "rgba(217,151,11,0.25)",
  },
  notes: { marginTop: 6, color: COLORS.text, fontSize: 12, lineHeight: 19 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
});
