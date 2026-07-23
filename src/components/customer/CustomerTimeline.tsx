import { StyleSheet, Text, View } from "react-native";

import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { CustomerActivity } from "../../storage/customerActivityStorage";

type Props = { activities: CustomerActivity[] };

const ICONS: Record<CustomerActivity["type"], string> = {
  created: "＋",
  updated: "✎",
  call: "☎",
  whatsapp: "💬",
  note: "📝",
  followup: "⏰",
  document: "📄",
};

export default function CustomerTimeline({ activities }: Props) {
  if (activities.length === 0) {
    return <Text style={styles.empty}>No customer activity yet.</Text>;
  }

  return (
    <View>
      {activities.map((activity, index) => (
        <View key={activity.id} style={styles.row}>
          <View style={styles.rail}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>{ICONS[activity.type]}</Text>
            </View>
            {index < activities.length - 1 && <View style={styles.line} />}
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>{activity.title}</Text>
            {!!activity.description && (
              <Text style={styles.description}>{activity.description}</Text>
            )}
            <Text style={styles.date}>
              {new Date(activity.createdAt).toLocaleString("en-IN")}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: COLORS.textMuted, textAlign: "center", paddingVertical: SPACING.xl },
  row: { flexDirection: "row", minHeight: 88 },
  rail: { width: 42, alignItems: "center" },
  iconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 14 },
  line: { width: 2, flex: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  content: { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  title: { color: COLORS.text, fontWeight: "900" },
  description: { color: COLORS.textMuted, marginTop: 5, lineHeight: 19 },
  date: { color: COLORS.textMuted, marginTop: 8, fontSize: 11 },
});
