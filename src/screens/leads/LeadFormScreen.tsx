import {
    useCallback,
    useEffect,
    useState,
} from "react";

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

import {
    useLocalSearchParams,
    useRouter,
} from "expo-router";

import BackButton from "../../components/BackButton";
import PrimaryButton from "../../components/PrimaryButton";

import {
    COLORS,
    RADIUS,
    SPACING,
} from "../../constants/theme";

import {
    createLead,
    deleteLead,
    fetchLeadById,
    updateLead,
    convertLeadToCustomer,
} from "../../services/leadsService";

import {
    LEAD_PRIORITIES,
    LEAD_SEGMENTS,
    LEAD_STAGES,
    LEAD_TEMPERATURES,
    type LeadPriority,
    type LeadSegment,
    type LeadStage,
    type LeadTemperature,
} from "../../types/lead";

type OptionButtonProps<T extends string> = {
  value: T;
  active: boolean;
  onPress: (value: T) => void;
};

function OptionButton<T extends string>({
  value,
  active,
  onPress,
}: OptionButtonProps<T>) {
  return (
    <Pressable
      onPress={() => onPress(value)}
      style={[
        styles.optionButton,
        active && styles.activeOptionButton,
      ]}
    >
      <Text
        style={[
          styles.optionText,
          active && styles.activeOptionText,
        ]}
      >
        {value}
      </Text>
    </Pressable>
  );
}

export default function LeadFormScreen() {
  const router = useRouter();

  const params =
    useLocalSearchParams<{
      id?: string;
    }>();

  const leadId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const isEditing = Boolean(leadId);

  const [customer, setCustomer] =
    useState("");

  const [mobile, setMobile] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [segment, setSegment] =
    useState<LeadSegment>("assets");

  const [source, setSource] =
    useState("Mobile App");

  const [property, setProperty] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [budget, setBudget] =
    useState("");

  const [value, setValue] =
    useState("");

  const [stage, setStage] =
    useState<LeadStage>("New Lead");

  const [priority, setPriority] =
    useState<LeadPriority>("Medium");

  const [
    temperature,
    setTemperature,
  ] = useState<LeadTemperature>("Warm");

  const [assignedTo, setAssignedTo] =
    useState("Admin");

  const [
    nextFollowup,
    setNextFollowup,
  ] = useState("");

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const loadLead =
    useCallback(async () => {
      if (!leadId) {
        return;
      }

      let storedLead;
      try {
        storedLead = await fetchLeadById(leadId);
      } catch (error) {
        console.error("Unable to load lead:", error);
      }

      if (!storedLead) {
        Alert.alert(
          "Lead Not Found",
          "Ye lead storage mein available nahi hai.",
          [
            {
              text: "Back",
              onPress: () => router.back(),
            },
          ]
        );

        return;
      }

      setCustomer(storedLead.customer);
      setMobile(storedLead.mobile);
      setEmail(storedLead.email);
      setSegment(storedLead.segment);
      setSource(storedLead.source);
      setProperty(storedLead.property);
      setLocation(storedLead.location);
      setBudget(storedLead.budget);

      setValue(
        storedLead.value
          ? String(storedLead.value)
          : ""
      );

      setStage(storedLead.stage);
      setPriority(storedLead.priority);

      setTemperature(
        storedLead.temperature
      );

      setAssignedTo(
        storedLead.assignedTo
      );

      setNextFollowup(
        storedLead.nextFollowup
      );

      setNotes(storedLead.notes);
    }, [leadId, router]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  async function handleSave() {
    if (loading) {
      return;
    }

    const cleanCustomer =
      customer.trim();

    const cleanMobile =
      mobile.replace(/\D/g, "");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanCustomer) {
      Alert.alert(
        "Customer Name Required",
        "Lead ka customer name enter karein."
      );

      return;
    }

    if (cleanMobile.length < 10) {
      Alert.alert(
        "Valid Mobile Required",
        "Kam se kam 10 digit mobile number enter karein."
      );

      return;
    }

    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      Alert.alert(
        "Invalid Email",
        "Valid email address enter karein."
      );

      return;
    }

    setLoading(true);

    try {
      const numericValue = Number(value.replace(/[^0-9.]/g, "") || 0);

      if (!Number.isFinite(numericValue) || numericValue < 0) {
        Alert.alert(
          "Invalid Lead Value",
          "Lead value valid number mein enter karein."
        );
        return;
      }

      const leadData = {
        customer: cleanCustomer,
        mobile: cleanMobile,
        email: cleanEmail,
        segment,
        source: source.trim(),
        property: property.trim(),
        location: location.trim(),
        budget: budget.trim(),
        value: numericValue,
        stage,
        priority,
        assignedTo: assignedTo.trim() || "Admin",
        nextFollowup: nextFollowup.trim(),
        notes: notes.trim(),
      };

      if (leadId) {
        await updateLead(
          leadId,
          leadData
        );
      } else {
        await createLead(leadData);
      }

      router.replace("/leads");
    } catch (error) {
      console.error(
        "Unable to save lead:",
        error
      );

      Alert.alert(
        "Save Failed",
        "Lead save nahi ho saki."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleConvertToCustomer() {
    if (!leadId) return;

    if (stage !== "Completed") {
      Alert.alert(
        "Lead Not Completed",
        "Customer banane se pahle Lead stage Completed karein."
      );
      return;
    }

    Alert.alert(
      "Convert to Customer",
      `${customer || "Ye lead"} ko Customer banana hai?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Convert",
          onPress: async () => {
            setLoading(true);
            try {
              const customerId = await convertLeadToCustomer(leadId);
              Alert.alert("Customer Created", "Lead successfully Customer ban gayi.", [
                {
                  text: "Open Customer",
                  onPress: () => router.replace({ pathname: "/customer-360", params: { id: customerId } }),
                },
              ]);
            } catch (error) {
              Alert.alert(
                "Conversion Failed",
                error instanceof Error ? error.message : "Lead Customer nahi ban saki."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  function handleDelete() {
    if (!leadId) {
      return;
    }

    Alert.alert(
      "Delete Lead",
      `${customer || "Ye lead"} permanently delete karni hai?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteLead(leadId);
            router.replace("/leads");
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <View style={styles.header}>
        <BackButton compact fallbackRoute="/leads" />

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {isEditing
              ? "Edit Lead"
              : "Add New Lead"}
          </Text>

          <Text style={styles.headerSubtitle}>
            JMK CRM Enterprise
          </Text>
        </View>

        {isEditing ? (
          <Pressable
            onPress={handleDelete}
            style={styles.deleteButton}
          >
            <Text
              style={styles.deleteButtonText}
            >
              Delete
            </Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>
          Customer Information
        </Text>

        <Text style={styles.label}>
          Customer Name *
        </Text>

        <TextInput
          value={customer}
          onChangeText={setCustomer}
          placeholder="Customer ka naam"
          placeholderTextColor={
            COLORS.textMuted
          }
          style={styles.input}
        />

        <Text style={styles.label}>
          Mobile Number *
        </Text>

        <TextInput
          value={mobile}
          onChangeText={setMobile}
          placeholder="10 digit mobile number"
          placeholderTextColor={
            COLORS.textMuted
          }
          keyboardType="phone-pad"
          maxLength={14}
          style={styles.input}
        />

        <Text style={styles.label}>
          Email Address
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="customer@example.com"
          placeholderTextColor={
            COLORS.textMuted
          }
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.sectionTitle}>
          Business Segment
        </Text>

        <View style={styles.optionsWrap}>
          {LEAD_SEGMENTS.map((item) => (
            <OptionButton
              key={item}
              value={item}
              active={segment === item}
              onPress={setSegment}
            />
          ))}
        </View>

        <Text style={styles.label}>
          Lead Source
        </Text>

        <TextInput
          value={source}
          onChangeText={setSource}
          placeholder="Website, Calling, Referral..."
          placeholderTextColor={
            COLORS.textMuted
          }
          style={styles.input}
        />

        <Text style={styles.label}>
          Property / Service Requirement
        </Text>

        <TextInput
          value={property}
          onChangeText={setProperty}
          placeholder="Row house, loan, solar plant..."
          placeholderTextColor={
            COLORS.textMuted
          }
          style={styles.input}
        />

        <Text style={styles.label}>
          Location
        </Text>

        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="Dewas, Indore..."
          placeholderTextColor={
            COLORS.textMuted
          }
          style={styles.input}
        />

        <Text style={styles.label}>
          Budget
        </Text>

        <TextInput
          value={budget}
          onChangeText={setBudget}
          placeholder="₹25–30 Lakh"
          placeholderTextColor={
            COLORS.textMuted
          }
          style={styles.input}
        />

        <Text style={styles.label}>
          Lead Value
        </Text>

        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="2500000"
          placeholderTextColor={
            COLORS.textMuted
          }
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.sectionTitle}>
          Lead Status
        </Text>

        <Text style={styles.label}>
          Pipeline Stage
        </Text>

        <View style={styles.optionsWrap}>
          {LEAD_STAGES.map((item) => (
            <OptionButton
              key={item}
              value={item}
              active={stage === item}
              onPress={setStage}
            />
          ))}
        </View>

        <Text style={styles.label}>
          Priority
        </Text>

        <View style={styles.optionsWrap}>
          {LEAD_PRIORITIES.map((item) => (
            <OptionButton
              key={item}
              value={item}
              active={priority === item}
              onPress={setPriority}
            />
          ))}
        </View>

        <Text style={styles.label}>
          Lead Temperature
        </Text>

        <View style={styles.optionsWrap}>
          {LEAD_TEMPERATURES.map(
            (item) => (
              <OptionButton
                key={item}
                value={item}
                active={
                  temperature === item
                }
                onPress={setTemperature}
              />
            )
          )}
        </View>

        <Text style={styles.label}>
          Assigned To
        </Text>

        <TextInput
          value={assignedTo}
          onChangeText={setAssignedTo}
          placeholder="Employee name"
          placeholderTextColor={
            COLORS.textMuted
          }
          style={styles.input}
        />

        <Text style={styles.label}>
          Next Follow-up
        </Text>

        <TextInput
          value={nextFollowup}
          onChangeText={setNextFollowup}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={
            COLORS.textMuted
          }
          style={styles.input}
        />

        <Text style={styles.label}>
          Notes
        </Text>

        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Lead ki complete requirement aur discussion..."
          placeholderTextColor={
            COLORS.textMuted
          }
          multiline
          textAlignVertical="top"
          style={[
            styles.input,
            styles.notesInput,
          ]}
        />

        <PrimaryButton
          title={
            isEditing
              ? "Update Lead"
              : "Save New Lead"
          }
          onPress={() => void handleSave()}
          loading={loading}
        />

        {isEditing && stage === "Completed" ? (
          <Pressable
            onPress={() => void handleConvertToCustomer()}
            style={styles.convertButton}
          >
            <Text style={styles.convertButtonText}>Convert to Customer</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
  },

  backText: {
    marginTop: -4,
    color: COLORS.white,
    fontSize: 34,
    fontWeight: "400",
  },

  headerContent: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
  },

  headerSubtitle: {
    marginTop: 2,
    color: COLORS.textMuted,
    fontSize: 10,
  },

  deleteButton: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    backgroundColor:
      "rgba(220,38,38,0.15)",
  },

  deleteButtonText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: "900",
  },

  headerSpacer: {
    width: 60,
  },

  convertButton: {
    marginTop: SPACING.md,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.success,
    backgroundColor: "rgba(34,197,94,0.12)",
  },

  convertButtonText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: "900",
  },

  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 50,
  },

  sectionTitle: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    color: COLORS.primary,
    fontSize: 17,
    fontWeight: "900",
  },

  label: {
    marginBottom: 8,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },

  input: {
    minHeight: 52,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    color: COLORS.white,
    fontSize: 13,
  },

  notesInput: {
    minHeight: 120,
    paddingTop: SPACING.lg,
  },

  optionsWrap: {
    marginBottom: SPACING.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  optionButton: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  activeOptionButton: {
    borderColor: COLORS.primary,
    backgroundColor:
      "rgba(220,38,38,0.14)",
  },

  optionText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "800",
  },

  activeOptionText: {
    color: COLORS.primary,
  },
});