import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
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
import { getCustomerById } from "../../storage/customerStorage";
import {
  addCustomerDocument,
  deleteCustomerDocument,
  getDocumentsByCustomerId,
  updateCustomerDocument,
} from "../../storage/customerDocumentStorage";
import { Customer } from "../../types/customer";
import {
  CUSTOMER_DOCUMENT_STATUSES,
  CUSTOMER_DOCUMENT_TYPES,
  CustomerDocument,
  CustomerDocumentStatus,
  CustomerDocumentType,
} from "../../types/customerDocument";

const EMPTY_FORM = {
  title: "",
  documentType: "Aadhaar" as CustomerDocumentType,
  documentNumber: "",
  fileName: "",
  localUri: "",
  status: "Pending" as CustomerDocumentStatus,
  notes: "",
};

export default function CustomerDocumentsScreen() {
  const params = useLocalSearchParams<{ customerId?: string | string[] }>();
  const customerId = Array.isArray(params.customerId)
    ? params.customerId[0]
    : params.customerId;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    if (!customerId) {
      setCustomer(null);
      setDocuments([]);
      return;
    }

    const [customerRecord, documentRecords] = await Promise.all([
      getCustomerById(customerId),
      getDocumentsByCustomerId(customerId),
    ]);

    setCustomer(customerRecord);
    setDocuments(documentRecords);
  }, [customerId]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const stats = useMemo(
    () => ({
      total: documents.length,
      verified: documents.filter((item) => item.status === "Verified").length,
      pending: documents.filter((item) => item.status === "Pending").length,
    }),
    [documents]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (document: CustomerDocument) => {
    setEditingId(document.id);
    setForm({
      title: document.title,
      documentType: document.documentType,
      documentNumber: document.documentNumber,
      fileName: document.fileName,
      localUri: document.localUri,
      status: document.status,
      notes: document.notes,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!customerId) return;

    if (!form.title.trim()) {
      Alert.alert("Required", "Document title enter karo.");
      return;
    }

    setSaving(true);
    try {
      const cleanForm = {
        ...form,
        title: form.title.trim(),
        documentNumber: form.documentNumber.trim(),
        fileName: form.fileName.trim(),
        localUri: form.localUri.trim(),
        notes: form.notes.trim(),
      };

      if (editingId) {
        await updateCustomerDocument(editingId, cleanForm);
      } else {
        await addCustomerDocument({ ...cleanForm, customerId });
      }

      setModalVisible(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadData();
    } catch (error) {
      console.error("Unable to save customer document:", error);
      Alert.alert("Save Failed", "Customer document save nahi ho saka.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (document: CustomerDocument) => {
    Alert.alert("Delete Document", `${document.title} delete karna hai?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCustomerDocument(document.id);
            await loadData();
          } catch (error) {
            console.error("Unable to delete customer document:", error);
            Alert.alert("Delete Failed", "Customer document delete nahi ho saka.");
          }
        },
      },
    ]);
  };

  if (!customerId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <AppHeader segment="Customer Documents" />
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>Customer missing</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader segment="Customer Documents" />

      <View style={styles.container}>
        <View style={styles.headingRow}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
          <Pressable style={styles.addButton} onPress={openCreate}>
            <Text style={styles.addButtonText}>＋ Add Document</Text>
          </Pressable>
        </View>

        <View style={styles.customerCard}>
          <Text style={styles.customerName}>{customer?.name || "Customer"}</Text>
          <Text style={styles.customerMeta}>
            {customer?.mobile || ""} {customer?.segment ? `• ${customer.segment}` : ""}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.verified}</Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No documents added</Text>
              <Text style={styles.emptyText}>
                Aadhaar, PAN, agreement ya registry record add karo.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.documentCard} onPress={() => openEdit(item)}>
              <View style={styles.documentHeader}>
                <View style={styles.documentIcon}>
                  <Text style={styles.documentIconText}>📄</Text>
                </View>
                <View style={styles.documentMain}>
                  <Text style={styles.documentTitle}>{item.title}</Text>
                  <Text style={styles.documentMeta}>
                    {item.documentType}
                    {item.documentNumber ? ` • ${item.documentNumber}` : ""}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === "Verified" && styles.verifiedBadge,
                    item.status === "Rejected" && styles.rejectedBadge,
                  ]}
                >
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              {!!item.fileName && (
                <Text style={styles.fileName}>File: {item.fileName}</Text>
              )}
              {!!item.notes && <Text style={styles.notes}>{item.notes}</Text>}

              <View style={styles.cardActions}>
                <Pressable style={styles.editButton} onPress={() => openEdit(item)}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </Pressable>
                <Pressable style={styles.deleteButton} onPress={() => handleDelete(item)}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              </View>
            </Pressable>
          )}
        />
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingId ? "Edit Document" : "Add Document"}
                </Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeText}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.label}>Document title *</Text>
              <TextInput
                value={form.title}
                onChangeText={(title) => setForm((current) => ({ ...current, title }))}
                placeholder="Example: Customer Aadhaar"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />

              <Text style={styles.label}>Document type</Text>
              <View style={styles.chipWrap}>
                {CUSTOMER_DOCUMENT_TYPES.map((documentType) => (
                  <Pressable
                    key={documentType}
                    style={[
                      styles.chip,
                      form.documentType === documentType && styles.activeChip,
                    ]}
                    onPress={() =>
                      setForm((current) => ({ ...current, documentType }))
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        form.documentType === documentType && styles.activeChipText,
                      ]}
                    >
                      {documentType}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Document number</Text>
              <TextInput
                value={form.documentNumber}
                onChangeText={(documentNumber) =>
                  setForm((current) => ({ ...current, documentNumber }))
                }
                placeholder="Number / reference"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>File name</Text>
              <TextInput
                value={form.fileName}
                onChangeText={(fileName) =>
                  setForm((current) => ({ ...current, fileName }))
                }
                placeholder="Example: aadhaar-front.jpg"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />

              <Text style={styles.label}>Local file URI</Text>
              <TextInput
                value={form.localUri}
                onChangeText={(localUri) =>
                  setForm((current) => ({ ...current, localUri }))
                }
                placeholder="Optional local URI"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                autoCapitalize="none"
              />

              <Text style={styles.label}>Verification status</Text>
              <View style={styles.chipWrap}>
                {CUSTOMER_DOCUMENT_STATUSES.map((status) => (
                  <Pressable
                    key={status}
                    style={[
                      styles.chip,
                      form.status === status && styles.activeChip,
                    ]}
                    onPress={() => setForm((current) => ({ ...current, status }))}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        form.status === status && styles.activeChipText,
                      ]}
                    >
                      {status}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Notes</Text>
              <TextInput
                value={form.notes}
                onChangeText={(notes) => setForm((current) => ({ ...current, notes }))}
                placeholder="Document notes"
                placeholderTextColor={COLORS.textMuted}
                style={[styles.input, styles.multilineInput]}
                multiline
                textAlignVertical="top"
              />

              <Pressable
                style={[styles.saveButton, saving && styles.disabledButton]}
                disabled={saving}
                onPress={() => void handleSave()}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? "Saving..." : "Save Document"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: SPACING.lg },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backText: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  addButtonText: { color: COLORS.white, fontWeight: "900" },
  customerCard: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  customerName: { color: COLORS.text, fontSize: 20, fontWeight: "900" },
  customerMeta: { color: COLORS.textMuted, marginTop: 5 },
  statsRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  statValue: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 3 },
  listContent: { paddingTop: SPACING.lg, paddingBottom: SPACING.xxl },
  documentCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  documentHeader: { flexDirection: "row", alignItems: "center" },
  documentIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  documentIconText: { fontSize: 20 },
  documentMain: { flex: 1, marginLeft: SPACING.md },
  documentTitle: { color: COLORS.text, fontSize: 16, fontWeight: "900" },
  documentMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  statusBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
  },
  verifiedBadge: { backgroundColor: COLORS.success },
  rejectedBadge: { backgroundColor: COLORS.danger },
  statusText: { color: COLORS.white, fontSize: 10, fontWeight: "900" },
  fileName: { color: COLORS.info, fontSize: 12, marginTop: SPACING.md },
  notes: { color: COLORS.textMuted, fontSize: 12, marginTop: SPACING.sm },
  cardActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md },
  editButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    paddingVertical: 9,
  },
  editButtonText: { color: COLORS.text, fontWeight: "800" },
  deleteButton: {
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  deleteButtonText: { color: COLORS.danger, fontWeight: "900" },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: SPACING.sm,
    maxWidth: 280,
  },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center" },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
  },
  primaryButtonText: { color: COLORS.white, fontWeight: "900" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: "92%",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  modalContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  modalTitle: { color: COLORS.text, fontSize: 21, fontWeight: "900" },
  closeText: { color: COLORS.text, fontSize: 20 },
  label: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  input: {
    minHeight: 48,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
  },
  multilineInput: { minHeight: 90, paddingTop: 12 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  chip: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.round,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "700" },
  activeChipText: { color: COLORS.white },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    alignItems: "center",
    paddingVertical: 14,
    marginTop: SPACING.xl,
  },
  disabledButton: { opacity: 0.55 },
  saveButtonText: { color: COLORS.white, fontWeight: "900", fontSize: 15 },
});
