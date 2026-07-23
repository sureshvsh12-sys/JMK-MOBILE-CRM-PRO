import { useCallback, useState, type ComponentProps } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../../components/AppHeader";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import {
  addFollowUp,
  getFollowUpById,
  updateFollowUp,
  type FollowUpMode,
  type FollowUpPriority,
} from "../../storage/followUpStorage";

const PRIORITIES: FollowUpPriority[] = ["Low", "Medium", "High"];
const MODES: FollowUpMode[] = ["Call", "WhatsApp", "Meeting", "Visit"];

function getDateParts(isoDate: string): { date: string; time: string } {
  const parsedDate = new Date(isoDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return {
      date: new Date().toISOString().slice(0, 10),
      time: "10:00",
    };
  }

  return {
    date: parsedDate.toISOString().slice(0, 10),
    time: parsedDate.toTimeString().slice(0, 5),
  };
}

function createDueAt(date: string, time: string): string | null {
  const normalizedDate = date.trim();
  const normalizedTime = time.trim();
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (!datePattern.test(normalizedDate) || !timePattern.test(normalizedTime)) {
    return null;
  }

  const parsedDate = new Date(`${normalizedDate}T${normalizedTime}:00`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
}

export default function FollowUpFormScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const editingId = Array.isArray(params.id) ? params.id[0] ?? "" : params.id ?? "";

  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueTime, setDueTime] = useState("10:00");
  const [priority, setPriority] = useState<FollowUpPriority>("Medium");
  const [mode, setMode] = useState<FollowUpMode>("Call");
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (!editingId) {
        return () => {
          active = false;
        };
      }

      void getFollowUpById(editingId).then((item) => {
        if (!active || !item) {
          return;
        }

        const dateParts = getDateParts(item.dueAt);
        setCustomerName(item.customerName);
        setMobile(item.mobile);
        setSubject(item.subject);
        setNotes(item.notes);
        setDueDate(dateParts.date);
        setDueTime(dateParts.time);
        setPriority(item.priority);
        setMode(item.mode);
      });

      return () => {
        active = false;
      };
    }, [editingId])
  );

  const handleSave = async () => {
    const cleanMobile = mobile.replace(/\D/g, "");

    if (!customerName.trim() || cleanMobile.length < 10 || !subject.trim()) {
      Alert.alert("Required", "Customer name, valid mobile aur subject bhariye.");
      return;
    }

    const dueAt = createDueAt(dueDate, dueTime);

    if (!dueAt) {
      Alert.alert("Invalid Date", "Date YYYY-MM-DD aur time HH:MM format mein bhariye.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        customerId: "",
        customerName: customerName.trim(),
        mobile: cleanMobile,
        subject: subject.trim(),
        notes: notes.trim(),
        dueAt,
        status: "Pending" as const,
        priority,
        mode,
        assignedTo: "Suresh Vishwakarma",
      };

      if (editingId) {
        await updateFollowUp(editingId, payload);
      } else {
        await addFollowUp(payload);
      }

      router.back();
    } catch (error) {
      console.error("Unable to save follow-up:", error);
      Alert.alert("Error", "Follow-up save nahi ho saka.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader segment={editingId ? "Edit Follow-up" : "New Follow-up"} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>
            {editingId ? "Update Follow-up" : "Create Follow-up"}
          </Text>
          <Text style={styles.subtitle}>
            Call, WhatsApp, meeting ya visit schedule karein.
          </Text>

          <Field
            label="Customer Name"
            value={customerName}
            onChangeText={setCustomerName}
          />
          <Field
            label="Mobile Number"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            maxLength={14}
          />
          <Field label="Subject" value={subject} onChangeText={setSubject} />

          <Text style={styles.label}>Mode</Text>
          <View style={styles.chipRow}>
            {MODES.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={mode === item}
                onPress={() => setMode(item)}
              />
            ))}
          </View>

          <Text style={styles.label}>Priority</Text>
          <View style={styles.chipRow}>
            {PRIORITIES.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={priority === item}
                onPress={() => setPriority(item)}
              />
            ))}
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateColumn}>
              <Field
                label="Date (YYYY-MM-DD)"
                value={dueDate}
                onChangeText={setDueDate}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.timeColumn}>
              <Field
                label="Time (HH:MM)"
                value={dueTime}
                onChangeText={setDueTime}
                autoCapitalize="none"
              />
            </View>
          </View>

          <Field label="Notes" value={notes} onChangeText={setNotes} multiline />

          <Pressable
            style={[styles.saveButton, saving && styles.disabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveText}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Follow-up"
                  : "Save Follow-up"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldProps = ComponentProps<typeof TextInput> & { label: string };

function Field({ label, multiline, style, ...props }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={COLORS.textMuted}
        style={[styles.input, multiline && styles.multiline, style]}
      />
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: "900" },
  subtitle: { color: COLORS.textMuted, marginTop: 4, marginBottom: SPACING.lg },
  field: { marginBottom: SPACING.lg },
  label: { color: COLORS.textMuted, fontSize: 12, fontWeight: "800", marginBottom: 8 },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 15,
    color: COLORS.text,
  },
  multiline: { minHeight: 110, paddingTop: 14, textAlignVertical: "top" },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.round,
  },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textMuted, fontWeight: "800", fontSize: 12 },
  chipTextSelected: { color: COLORS.white },
  dateRow: { flexDirection: "row", gap: SPACING.md },
  dateColumn: { flex: 1.5 },
  timeColumn: { flex: 1 },
  saveButton: {
    backgroundColor: COLORS.primary,
    minHeight: 52,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.sm,
  },
  saveText: { color: COLORS.white, fontWeight: "900", fontSize: 15 },
  disabled: { opacity: 0.6 },
});
