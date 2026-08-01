import { useCallback, useState, type ComponentProps } from "react";
import {
  Alert,
  BackHandler,
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
import BackButton from "../../components/BackButton";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import {
  addFollowUp,
  getFollowUpById,
  updateFollowUp,
  type FollowUpMode,
  type FollowUpPriority,
  type FollowUpStatus,
} from "../../storage/followUpStorage";

const PRIORITIES: FollowUpPriority[] = ["Low", "Medium", "High"];
const MODES: FollowUpMode[] = ["Call", "WhatsApp", "Meeting", "Visit"];

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateParts(isoDate: string): { date: string; time: string } {
  const parsedDate = new Date(isoDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return { date: formatLocalDate(new Date()), time: "10:00" };
  }

  return {
    date: formatLocalDate(parsedDate),
    time: `${String(parsedDate.getHours()).padStart(2, "0")}:${String(
      parsedDate.getMinutes()
    ).padStart(2, "0")}`,
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
  const [dueDate, setDueDate] = useState(formatLocalDate(new Date()));
  const [dueTime, setDueTime] = useState("10:00");
  const [priority, setPriority] = useState<FollowUpPriority>("Medium");
  const [mode, setMode] = useState<FollowUpMode>("Call");
  const [status, setStatus] = useState<FollowUpStatus>("Pending");
  const [customerId, setCustomerId] = useState("");
  const [assignedTo, setAssignedTo] = useState("Suresh Vishwakarma");
  const [loading, setLoading] = useState(Boolean(editingId));
  const [saving, setSaving] = useState(false);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/followups");
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        goBack();
        return true;
      });

      if (!editingId) {
        setLoading(false);
        return () => {
          active = false;
          subscription.remove();
        };
      }

      setLoading(true);
      void getFollowUpById(editingId)
        .then((item) => {
          if (!active) return;

          if (!item) {
            Alert.alert("Not Found", "Follow-up record nahi mila.", [
              { text: "Back", onPress: goBack },
            ]);
            return;
          }

          const dateParts = getDateParts(item.dueAt);
          setCustomerId(item.customerId);
          setCustomerName(item.customerName);
          setMobile(item.mobile);
          setSubject(item.subject);
          setNotes(item.notes);
          setDueDate(dateParts.date);
          setDueTime(dateParts.time);
          setPriority(item.priority);
          setMode(item.mode);
          setStatus(item.status);
          setAssignedTo(item.assignedTo || "Suresh Vishwakarma");
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
        subscription.remove();
      };
    }, [editingId, goBack])
  );

  const setQuickDate = (daysFromToday: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    setDueDate(formatLocalDate(date));
  };

  const handleSave = async () => {
    const cleanMobile = mobile.replace(/\D/g, "");

    if (!customerName.trim()) {
      Alert.alert("Customer Name Required", "Customer ka naam bhariye.");
      return;
    }

    if (cleanMobile.length < 10 || cleanMobile.length > 13) {
      Alert.alert("Invalid Mobile", "Valid mobile number bhariye.");
      return;
    }

    if (!subject.trim()) {
      Alert.alert("Subject Required", "Follow-up ka subject bhariye.");
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
        customerId,
        customerName: customerName.trim(),
        mobile: cleanMobile,
        subject: subject.trim(),
        notes: notes.trim(),
        dueAt,
        status,
        priority,
        mode,
        assignedTo: assignedTo.trim() || "Suresh Vishwakarma",
      };

      if (editingId) {
        const updated = await updateFollowUp(editingId, payload);
        if (!updated) {
          Alert.alert("Error", "Follow-up update nahi ho saka.");
          return;
        }
      } else {
        await addFollowUp(payload);
      }

      router.replace("/followups");
    } catch (error) {
      console.error("Unable to save follow-up:", error);
      Alert.alert("Error", "Follow-up save nahi ho saka. Dobara try karein.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader
        segment={editingId ? "Edit Follow-up" : "New Follow-up"}
        onMenuPress={goBack}
        onNotificationPress={() => router.push("/notifications")}
        onProfilePress={() => router.push("/settings")}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BackButton label="Follow-ups" onPress={goBack} />

          <View style={styles.headingBlock}>
            <Text style={styles.eyebrow}>{editingId ? "UPDATE ACTIVITY" : "SCHEDULE ACTIVITY"}</Text>
            <Text style={styles.title}>{editingId ? "Update Follow-up" : "Create Follow-up"}</Text>
            <Text style={styles.subtitle}>
              Customer se next contact ka date, mode aur priority set karein.
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Follow-up loading...</Text>
            </View>
          ) : (
            <>
              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>Customer Details</Text>
                <Field
                  label="Customer Name *"
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Customer ka full name"
                  autoCapitalize="words"
                />
                <Field
                  label="Mobile Number *"
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="10-digit mobile number"
                  keyboardType="phone-pad"
                  maxLength={13}
                />
                <Field
                  label="Subject *"
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="Example: Property site visit"
                  autoCapitalize="sentences"
                />
              </View>

              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>Follow-up Plan</Text>

                <Text style={styles.label}>Mode</Text>
                <View style={styles.chipRow}>
                  {MODES.map((item) => (
                    <Chip
                      key={item}
                      label={item}
                      icon={getModeIcon(item)}
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
                      tone={item}
                      onPress={() => setPriority(item)}
                    />
                  ))}
                </View>

                {editingId ? (
                  <>
                    <Text style={styles.label}>Status</Text>
                    <View style={styles.chipRow}>
                      {(["Pending", "Completed", "Cancelled"] as FollowUpStatus[]).map((item) => (
                        <Chip
                          key={item}
                          label={item}
                          selected={status === item}
                          onPress={() => setStatus(item)}
                        />
                      ))}
                    </View>
                  </>
                ) : null}

                <Text style={styles.label}>Quick Date</Text>
                <View style={styles.quickDateRow}>
                  <QuickDate label="Today" onPress={() => setQuickDate(0)} />
                  <QuickDate label="Tomorrow" onPress={() => setQuickDate(1)} />
                  <QuickDate label="+7 Days" onPress={() => setQuickDate(7)} />
                </View>

                <View style={styles.dateRow}>
                  <View style={styles.dateColumn}>
                    <Field
                      label="Date (YYYY-MM-DD) *"
                      value={dueDate}
                      onChangeText={setDueDate}
                      autoCapitalize="none"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  <View style={styles.timeColumn}>
                    <Field
                      label="Time (HH:MM) *"
                      value={dueTime}
                      onChangeText={setDueTime}
                      autoCapitalize="none"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                </View>

                <Field
                  label="Assigned To"
                  value={assignedTo}
                  onChangeText={setAssignedTo}
                  placeholder="Employee name"
                  autoCapitalize="words"
                />

                <Field
                  label="Notes"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Discussion points, documents ya next action"
                  multiline
                />
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>FOLLOW-UP SUMMARY</Text>
                <Text style={styles.summaryTitle}>{subject.trim() || "Subject not added"}</Text>
                <Text style={styles.summaryText}>
                  {mode} • {priority} priority • {dueDate} at {dueTime}
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  saving && styles.disabled,
                  pressed && !saving && styles.pressed,
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveText}>
                  {saving ? "Saving..." : editingId ? "Update Follow-up" : "Save Follow-up"}
                </Text>
              </Pressable>
            </>
          )}
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
  icon,
  selected,
  tone,
  onPress,
}: {
  label: string;
  icon?: string;
  selected: boolean;
  tone?: FollowUpPriority;
  onPress: () => void;
}) {
  const selectedStyle =
    tone === "High"
      ? styles.chipHigh
      : tone === "Low"
        ? styles.chipLow
        : styles.chipSelected;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        selected && selectedStyle,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      {icon ? <Text style={[styles.chipIcon, selected && styles.chipTextSelected]}>{icon}</Text> : null}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function QuickDate({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.quickDateButton, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Text style={styles.quickDateText}>{label}</Text>
    </Pressable>
  );
}

function getModeIcon(mode: FollowUpMode): string {
  if (mode === "WhatsApp") return "◉";
  if (mode === "Meeting") return "◆";
  if (mode === "Visit") return "⌂";
  return "☎";
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 48 },
  backButton: {
    alignSelf: "flex-start",
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backIcon: { color: COLORS.white, fontSize: 27, lineHeight: 28, marginRight: 7, fontWeight: "700" },
  backText: { color: COLORS.white, fontSize: 11, fontWeight: "900" },
  pressed: { opacity: 0.74, transform: [{ scale: 0.985 }] },
  headingBlock: { marginTop: SPACING.xl, marginBottom: SPACING.lg },
  eyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: COLORS.text, fontSize: 27, fontWeight: "900", marginTop: 5 },
  subtitle: { color: COLORS.textMuted, marginTop: 5, lineHeight: 19, fontSize: 12 },
  loadingCard: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
  },
  loadingText: { color: COLORS.textMuted, fontWeight: "800" },
  formCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOW,
  },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: "900", marginBottom: SPACING.lg },
  field: { marginBottom: SPACING.lg },
  label: { color: COLORS.textMuted, fontSize: 11, fontWeight: "900", marginBottom: 8 },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: 15,
    color: COLORS.text,
    fontSize: 13,
  },
  multiline: { minHeight: 112, paddingTop: 14, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.lg },
  chip: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 14,
    borderRadius: RADIUS.round,
  },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipHigh: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  chipLow: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  chipIcon: { color: COLORS.textMuted, marginRight: 6, fontWeight: "900" },
  chipText: { color: COLORS.textMuted, fontWeight: "900", fontSize: 11 },
  chipTextSelected: { color: COLORS.white },
  quickDateRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.lg },
  quickDateButton: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.35)",
    borderRadius: RADIUS.md,
  },
  quickDateText: { color: COLORS.primary, fontSize: 10, fontWeight: "900" },
  dateRow: { flexDirection: "row", gap: SPACING.md },
  dateColumn: { flex: 1.45 },
  timeColumn: { flex: 1 },
  summaryCard: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.35)",
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  summaryLabel: { color: COLORS.primary, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  summaryTitle: { color: COLORS.text, fontSize: 15, fontWeight: "900", marginTop: 7 },
  summaryText: { color: COLORS.textMuted, fontSize: 11, marginTop: 5 },
  saveButton: {
    backgroundColor: COLORS.primary,
    minHeight: 54,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW,
  },
  saveText: { color: COLORS.white, fontWeight: "900", fontSize: 15 },
  disabled: { opacity: 0.58 },
});
