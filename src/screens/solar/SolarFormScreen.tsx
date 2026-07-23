import { useCallback, useState } from "react";
import type { ComponentProps } from "react";
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
  createSolarProject,
  getSolarProjectById,
  updateSolarProject,
} from "../../storage/solarStorage";
import type { SolarProjectInput, SolarStatus } from "../../storage/solarStorage";

const STATUSES: SolarStatus[] = [
  "New Lead",
  "Site Visit",
  "Quotation",
  "Approved",
  "Installation",
  "Completed",
  "Cancelled",
];

const emptyForm: SolarProjectInput = {
  customerName: "",
  mobile: "",
  address: "",
  systemSizeKw: 0,
  projectValue: 0,
  advanceAmount: 0,
  status: "New Lead",
  nextFollowUp: "",
  notes: "",
};

export default function SolarFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const projectId = typeof params.id === "string" ? params.id : undefined;
  const [form, setForm] = useState<SolarProjectInput>(emptyForm);
  const [loading, setLoading] = useState(Boolean(projectId));
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        if (!projectId) {
          setLoading(false);
          return;
        }

        const project = await getSolarProjectById(projectId);
        if (!active) return;

        if (project) {
          setForm({
            customerName: project.customerName,
            mobile: project.mobile,
            address: project.address,
            systemSizeKw: project.systemSizeKw,
            projectValue: project.projectValue,
            advanceAmount: project.advanceAmount,
            status: project.status,
            nextFollowUp: project.nextFollowUp,
            notes: project.notes,
          });
        }
        setLoading(false);
      };

      void load();
      return () => {
        active = false;
      };
    }, [projectId])
  );

  const setText = (key: keyof SolarProjectInput, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const setNumber = (
    key: "systemSizeKw" | "projectValue" | "advanceAmount",
    value: string
  ) => {
    const clean = value.replace(/[^0-9.]/g, "");
    setForm((current) => ({ ...current, [key]: Number(clean) || 0 }));
  };

  const save = async () => {
    if (!form.customerName.trim()) {
      Alert.alert("Customer Name Required", "Customer ka naam enter karein.");
      return;
    }
    const cleanMobile = form.mobile.replace(/\D/g, "");
    if (cleanMobile.length < 10) {
      Alert.alert("Invalid Mobile", "Valid customer mobile number enter karein.");
      return;
    }
    if (form.systemSizeKw <= 0) {
      Alert.alert("System Size Required", "Solar system size kW me enter karein.");
      return;
    }

    setSaving(true);
    try {
      const payload: SolarProjectInput = {
        ...form,
        customerName: form.customerName.trim(),
        mobile: cleanMobile,
        address: form.address.trim(),
        nextFollowUp: form.nextFollowUp.trim(),
        notes: form.notes.trim(),
      };

      if (projectId) {
        await updateSolarProject(projectId, payload);
      } else {
        await createSolarProject(payload);
      }

      router.replace("/solar");
    } catch {
      Alert.alert("Save Failed", "Solar project save nahi hua. Dobara try karein.");
    } finally {
      setSaving(false);
    }
  };

  const balance = Math.max(form.projectValue - form.advanceAmount, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader segment={projectId ? "Edit Solar Project" : "New Solar Project"} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.headingRow}>
            <View>
              <Text style={styles.title}>{projectId ? "Edit Project" : "Add Solar Lead"}</Text>
              <Text style={styles.subtitle}>Customer aur installation details</Text>
            </View>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>

          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            <>
              <Field
                label="Customer Name *"
                value={form.customerName}
                onChangeText={(value) => setText("customerName", value)}
                placeholder="Customer name"
              />
              <Field
                label="Mobile Number *"
                value={form.mobile}
                onChangeText={(value) => setText("mobile", value)}
                placeholder="10 digit mobile number"
                keyboardType="phone-pad"
              />
              <Field
                label="Address"
                value={form.address}
                onChangeText={(value) => setText("address", value)}
                placeholder="Site address"
                multiline
              />

              <View style={styles.twoColumnRow}>
                <View style={styles.column}>
                  <Field
                    label="System Size (kW) *"
                    value={form.systemSizeKw ? String(form.systemSizeKw) : ""}
                    onChangeText={(value) => setNumber("systemSizeKw", value)}
                    placeholder="5"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.column}>
                  <Field
                    label="Project Value"
                    value={form.projectValue ? String(form.projectValue) : ""}
                    onChangeText={(value) => setNumber("projectValue", value)}
                    placeholder="250000"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.twoColumnRow}>
                <View style={styles.column}>
                  <Field
                    label="Advance Amount"
                    value={form.advanceAmount ? String(form.advanceAmount) : ""}
                    onChangeText={(value) => setNumber("advanceAmount", value)}
                    placeholder="50000"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.column}>
                  <Text style={styles.fieldLabel}>Balance</Text>
                  <View style={styles.readOnlyBox}>
                    <Text style={styles.balanceValue}>₹{balance.toLocaleString("en-IN")}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Status</Text>
              <View style={styles.statusWrap}>
                {STATUSES.map((status) => {
                  const selected = form.status === status;
                  return (
                    <Pressable
                      key={status}
                      onPress={() => setForm((current) => ({ ...current, status }))}
                      style={[styles.statusChip, selected && styles.statusChipSelected]}
                    >
                      <Text style={[styles.statusChipText, selected && styles.statusChipTextSelected]}>
                        {status}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Field
                label="Next Follow-up Date"
                value={form.nextFollowUp}
                onChangeText={(value) => setText("nextFollowUp", value)}
                placeholder="DD-MM-YYYY"
              />
              <Field
                label="Notes"
                value={form.notes}
                onChangeText={(value) => setText("notes", value)}
                placeholder="Quotation, subsidy, panel or inverter details"
                multiline
              />

              <Pressable
                disabled={saving}
                onPress={() => void save()}
                style={[styles.saveButton, saving && styles.disabledButton]}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? "Saving..." : projectId ? "Update Solar Project" : "Save Solar Project"}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad" | "numeric" | "decimal-pad";
  multiline?: boolean;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
}: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  title: { color: COLORS.text, fontSize: 24, fontWeight: "900" },
  subtitle: { color: COLORS.textMuted, marginTop: 4 },
  cancelText: { color: COLORS.solar, fontWeight: "800" },
  loadingText: { color: COLORS.textMuted, textAlign: "center", marginTop: SPACING.xxl },
  fieldWrap: { marginBottom: SPACING.lg },
  fieldLabel: { color: COLORS.text, fontSize: 12, fontWeight: "800", marginBottom: 8 },
  input: {
    minHeight: 50,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  multilineInput: { minHeight: 96, textAlignVertical: "top" },
  twoColumnRow: { flexDirection: "row", gap: SPACING.md },
  column: { flex: 1 },
  readOnlyBox: {
    minHeight: 50,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
  },
  balanceValue: { color: COLORS.warning, fontWeight: "900" },
  statusWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statusChip: {
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  statusChipSelected: { backgroundColor: COLORS.solar, borderColor: COLORS.solar },
  statusChipText: { color: COLORS.textMuted, fontSize: 11, fontWeight: "800" },
  statusChipTextSelected: { color: COLORS.black },
  saveButton: {
    minHeight: 54,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.solar,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.sm,
  },
  disabledButton: { opacity: 0.6 },
  saveButtonText: { color: COLORS.black, fontSize: 15, fontWeight: "900" },
});
