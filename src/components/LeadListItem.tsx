import {
    Linking,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    COLORS,
    RADIUS,
    SPACING,
} from "../constants/theme";

import {
    Lead,
} from "../types/lead";

type LeadListItemProps = {
  lead: Lead;
  onPress: () => void;
  onStagePress?: () => void;
};

function getPriorityColor(
  priority: Lead["priority"]
) {
  if (priority === "High") {
    return COLORS.danger;
  }

  if (priority === "Low") {
    return COLORS.success;
  }

  return COLORS.warning;
}

function getTemperatureColor(
  temperature: Lead["temperature"]
) {
  if (temperature === "Hot") {
    return COLORS.danger;
  }

  if (temperature === "Cold") {
    return COLORS.finance;
  }

  return COLORS.warning;
}

export default function LeadListItem({
  lead,
  onPress,
  onStagePress,
}: LeadListItemProps) {
  function handleCall() {
    const mobile = String(
      lead.mobile || ""
    ).replace(/\D/g, "");

    if (!mobile) {
      return;
    }

    Linking.openURL(`tel:${mobile}`);
  }

  function handleWhatsApp() {
    const mobile = String(
      lead.mobile || ""
    ).replace(/\D/g, "");

    if (!mobile) {
      return;
    }

    const whatsappNumber =
      mobile.length === 10
        ? `91${mobile}`
        : mobile;

    const message = encodeURIComponent(
      `Namaste ${lead.customer}, JMK Group se aapki ${lead.property || "requirement"} ke sambandh mein sampark kar rahe hain.`
    );

    Linking.openURL(
      `https://wa.me/${whatsappNumber}?text=${message}`
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.customerSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {lead.customer
                .charAt(0)
                .toUpperCase() || "L"}
            </Text>
          </View>

          <View style={styles.customerContent}>
            <Text
              style={styles.customerName}
              numberOfLines={1}
            >
              {lead.customer}
            </Text>

            <Text style={styles.mobile}>
              {lead.mobile || "No mobile"}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.priorityBadge,
            {
              backgroundColor: `${getPriorityColor(
                lead.priority
              )}20`,
            },
          ]}
        >
          <Text
            style={[
              styles.priorityText,
              {
                color: getPriorityColor(
                  lead.priority
                ),
              },
            ]}
          >
            {lead.priority}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text
          style={styles.property}
          numberOfLines={1}
        >
          {lead.property ||
            "Requirement not added"}
        </Text>

        <Text
          style={styles.location}
          numberOfLines={1}
        >
          📍 {lead.location || "Location not added"}
        </Text>
      </View>

      <View style={styles.tagsRow}>
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onStagePress?.();
          }}
          style={styles.stageBadge}
        >
          <Text style={styles.stageText}>{lead.stage} ▾</Text>
        </Pressable>

        <View
          style={[
            styles.temperatureBadge,
            {
              borderColor: getTemperatureColor(
                lead.temperature
              ),
            },
          ]}
        >
          <Text
            style={[
              styles.temperatureText,
              {
                color: getTemperatureColor(
                  lead.temperature
                ),
              },
            ]}
          >
            {lead.temperature}
          </Text>
        </View>

        <View style={styles.segmentBadge}>
          <Text style={styles.segmentText}>
            {lead.segment === "finance" ? "Finance" : lead.segment === "solar" ? "Solar" : "Assets"}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.valueSection}>
          <Text style={styles.valueLabel}>
            Lead Value
          </Text>

          <Text style={styles.value}>
            ₹
            {Number(
              lead.value || 0
            ).toLocaleString("en-IN")}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              handleCall();
            }}
            style={styles.callButton}
          >
            <Text style={styles.actionText}>
              Call
            </Text>
          </Pressable>

          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              handleWhatsApp();
            }}
            style={styles.whatsappButton}
          >
            <Text style={styles.actionText}>
              WhatsApp
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  pressed: {
    opacity: 0.76,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SPACING.md,
  },

  customerSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: COLORS.primary,
  },

  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
  },

  customerContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  customerName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },

  mobile: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 12,
  },

  priorityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
  },

  priorityText: {
    fontSize: 10,
    fontWeight: "900",
  },

  details: {
    marginTop: SPACING.md,
  },

  property: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },

  location: {
    marginTop: 6,
    color: COLORS.textMuted,
    fontSize: 11,
  },

  tagsRow: {
    marginTop: SPACING.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  stageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
    backgroundColor:
      "rgba(59,130,246,0.14)",
  },

  stageText: {
    color: "#60A5FA",
    fontSize: 10,
    fontWeight: "800",
  },

  temperatureBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
    borderWidth: 1,
  },

  temperatureText: {
    fontSize: 10,
    fontWeight: "800",
  },

  segmentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
    backgroundColor:
      "rgba(139,92,246,0.14)",
  },

  segmentText: {
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: "800",
  },

  footerRow: {
    marginTop: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
  },

  valueSection: {
    flex: 1,
  },

  valueLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  value: {
    marginTop: 3,
    color: COLORS.success,
    fontSize: 15,
    fontWeight: "900",
  },

  actions: {
    flexDirection: "row",
    gap: 7,
  },

  callButton: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.finance,
  },

  whatsappButton: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.success,
  },

  actionText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
  },
});