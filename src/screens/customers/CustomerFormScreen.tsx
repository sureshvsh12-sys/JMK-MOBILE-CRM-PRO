import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "../../components/PrimaryButton";
import BackButton from "../../components/BackButton";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { addCustomer, getCustomerById, updateCustomer } from "../../storage/customerStorage";
import {
  CUSTOMER_SEGMENTS,
  CUSTOMER_STATUSES,
  CustomerSegment,
  CustomerStatus,
} from "../../types/customer";

export default function CustomerFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const customerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");
  const [email, setEmail] = useState("");
  const [segment, setSegment] = useState<CustomerSegment>("Assets");
  const [status, setStatus] = useState<CustomerStatus>("Prospect");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  const [source, setSource] = useState("Mobile App");
  const [assignedTo, setAssignedTo] = useState("Admin");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!customerId) return;

    void (async () => {
      const customer = await getCustomerById(customerId);
      if (!customer) return;
      setName(customer.name);
      setMobile(customer.mobile);
      setAlternateMobile(customer.alternateMobile);
      setEmail(customer.email);
      setSegment(customer.segment);
      setStatus(customer.status);
      setCity(customer.city);
      setAddress(customer.address);
      setOccupation(customer.occupation);
      setSource(customer.source);
      setAssignedTo(customer.assignedTo);
      setNotes(customer.notes);
    })();
  }, [customerId]);

  const handleSave = async () => {
    if (loading) return;

    const cleanName = name.trim();
    const cleanMobile = mobile.replace(/\D/g, "");
    const cleanAlternateMobile = alternateMobile.replace(/\D/g, "");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName) {
      Alert.alert("Required", "Customer name enter karein.");
      return;
    }
    if (cleanMobile.length !== 10) {
      Alert.alert("Invalid Mobile", "10 digit mobile number enter karein.");
      return;
    }

    if (cleanAlternateMobile && cleanAlternateMobile.length !== 10) {
      Alert.alert("Invalid Alternate Mobile", "Alternate mobile 10 digit ka hona chahiye.");
      return;
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      Alert.alert("Invalid Email", "Valid email address enter karein.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: cleanName,
        mobile: cleanMobile,
        alternateMobile: cleanAlternateMobile,
        email: cleanEmail,
        segment,
        status,
        city: city.trim(),
        address: address.trim(),
        occupation: occupation.trim(),
        source: source.trim() || "Mobile App",
        assignedTo: assignedTo.trim() || "Admin",
        notes: notes.trim(),
      };

      if (customerId) await updateCustomer(customerId, payload);
      else await addCustomer(payload);

      router.replace("/customers" as never);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Customer save nahi ho saka.");
    } finally {
      setLoading(false);
    }
  };

  const field = (
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    options: { keyboardType?: "default" | "phone-pad" | "email-address"; multiline?: boolean } = {}
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={options.keyboardType || "default"}
        autoCapitalize={options.keyboardType === "email-address" ? "none" : "sentences"}
        autoCorrect={options.keyboardType !== "email-address"}
        multiline={options.multiline}
        placeholderTextColor={COLORS.textMuted}
        style={[styles.input, options.multiline && styles.multiline]}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <BackButton compact fallbackRoute="/customers" />
          <Text style={styles.headerTitle}>{customerId ? "Edit Customer" : "New Customer"}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {field("Customer Name *", name, setName)}
          {field("Mobile Number *", mobile, setMobile, { keyboardType: "phone-pad" })}
          {field("Alternate Mobile", alternateMobile, setAlternateMobile, { keyboardType: "phone-pad" })}
          {field("Email", email, setEmail, { keyboardType: "email-address" })}

          <Text style={styles.label}>Business Segment</Text>
          <View style={styles.optionRow}>
            {CUSTOMER_SEGMENTS.map((item) => (
              <Pressable key={item} style={[styles.option, segment === item && styles.optionActive]} onPress={() => setSegment(item)}>
                <Text style={[styles.optionText, segment === item && styles.optionTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Status</Text>
          <View style={styles.optionRow}>
            {CUSTOMER_STATUSES.map((item) => (
              <Pressable key={item} style={[styles.option, status === item && styles.optionActive]} onPress={() => setStatus(item)}>
                <Text style={[styles.optionText, status === item && styles.optionTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          {field("City", city, setCity)}
          {field("Address", address, setAddress, { multiline: true })}
          {field("Occupation", occupation, setOccupation)}
          {field("Lead Source", source, setSource)}
          {field("Assigned To", assignedTo, setAssignedTo)}
          {field("Notes", notes, setNotes, { multiline: true })}

          <PrimaryButton title={customerId ? "Update Customer" : "Save Customer"} onPress={handleSave} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  header: { minHeight: 62, paddingHorizontal: SPACING.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back: { color: COLORS.primary, fontSize: 16, fontWeight: "900" },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  headerSpacer: { width: 48 },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  field: { marginBottom: SPACING.lg },
  label: { color: COLORS.text, fontSize: 12, fontWeight: "800", marginBottom: SPACING.sm },
  input: { minHeight: 50, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.text, paddingHorizontal: 14 },
  multiline: { minHeight: 92, paddingTop: 14, textAlignVertical: "top" },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.lg },
  option: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.round, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  optionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "800" },
  optionTextActive: { color: COLORS.white },
});
