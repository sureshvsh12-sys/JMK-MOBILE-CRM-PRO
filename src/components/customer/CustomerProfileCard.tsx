import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { Customer } from "../../types/customer";

type Props = {
  customer: Customer;
  onEdit: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
};

export default function CustomerProfileCard({
  customer,
  onEdit,
  onCall,
  onWhatsApp,
}: Props) {
  const initials = customer.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || "C"}</Text>
        </View>
        <View style={styles.identity}>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.mobile}>{customer.mobile}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{customer.segment}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{customer.status}</Text>
            </View>
          </View>
        </View>
        <Pressable style={styles.editButton} onPress={onEdit}>
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.actionButton} onPress={onCall}>
          <Text style={styles.actionText}>📞 Call</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={onWhatsApp}>
          <Text style={styles.actionText}>💬 WhatsApp</Text>
        </Pressable>
        {!!customer.email && (
          <Pressable
            style={styles.actionButton}
            onPress={() => Linking.openURL(`mailto:${customer.email}`)}
          >
            <Text style={styles.actionText}>✉ Email</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.divider} />
      <Text style={styles.detail}>City: {customer.city || "Not added"}</Text>
      <Text style={styles.detail}>Occupation: {customer.occupation || "Not added"}</Text>
      <Text style={styles.detail}>Source: {customer.source || "Mobile App"}</Text>
      <Text style={styles.detail}>Assigned To: {customer.assignedTo || "Admin"}</Text>
      {!!customer.address && <Text style={styles.detail}>Address: {customer.address}</Text>}
      {!!customer.notes && <Text style={styles.notes}>{customer.notes}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.lg },
  topRow: { flexDirection: "row", alignItems: "flex-start" },
  avatar: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primary },
  avatarText: { color: COLORS.white, fontSize: 20, fontWeight: "900" },
  identity: { flex: 1, marginLeft: SPACING.md },
  name: { color: COLORS.text, fontSize: 20, fontWeight: "900" },
  mobile: { color: COLORS.textMuted, marginTop: 4 },
  badgeRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.sm },
  badge: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.round, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { color: COLORS.text, fontSize: 11, fontWeight: "800" },
  editButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.sm, backgroundColor: COLORS.surfaceLight },
  editText: { color: COLORS.primary, fontWeight: "900" },
  actionRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg },
  actionButton: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.sm, backgroundColor: COLORS.surfaceLight },
  actionText: { color: COLORS.text, fontSize: 12, fontWeight: "800" },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.lg },
  detail: { color: COLORS.textMuted, fontSize: 13, lineHeight: 21, marginBottom: 3 },
  notes: { marginTop: SPACING.sm, color: COLORS.text, lineHeight: 20, backgroundColor: COLORS.background, padding: SPACING.md, borderRadius: RADIUS.md },
});
