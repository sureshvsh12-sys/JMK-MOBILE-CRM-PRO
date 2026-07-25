import { useCallback, useState } from "react";
import type { ComponentProps, PropsWithChildren } from "react";
import {
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../../components/AppHeader";
import SystemHealthCard from "../../components/settings/SystemHealthCard";
import {
  COLORS,
  RADIUS,
  SPACING,
} from "../../constants/theme";
import {
  clearAllCrmData,
  createBackup,
  getSettings,
  restoreBackup,
  saveSettings,
} from "../../storage/settingsStorage";
import type { AppSettings } from "../../storage/settingsStorage";
import { logout } from "../../storage/authStorage";
import { useSync } from "../../hooks/useSync";

const SEGMENTS: AppSettings["defaultSegment"][] = [
  "Finance",
  "Assets",
  "Solar",
];

export default function SettingsScreen() {
  const router = useRouter();

  const [settings, setSettings] = useState<AppSettings | null>(
    null
  );
  const [backupText, setBackupText] = useState("");
  const [saving, setSaving] = useState(false);
  const { config: syncConfig, queueCount, syncing, saveConfig: saveSyncConfig, runSync } = useSync();

  const loadSettings = useCallback(async () => {
    setSettings(await getSettings());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSettings();

      const backSubscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          router.replace("/dashboard");
          return true;
        }
      );

      return () => {
        backSubscription.remove();
      };
    }, [loadSettings, router])
  );

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/dashboard");
  };

  const goHome = () => {
    router.replace("/dashboard");
  };

  const updateField = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings((current) =>
      current
        ? {
            ...current,
            [key]: value,
          }
        : current
    );
  };

  const handleSave = async () => {
    if (!settings) return;

    if (!settings.companyName.trim()) {
      Alert.alert("Required", "Company name enter karein.");
      return;
    }

    const cleanMobile = settings.mobile.replace(/\D/g, "");
    if (settings.mobile.trim() && cleanMobile.length < 10) {
      Alert.alert("Invalid Mobile", "Valid mobile number enter karein.");
      return;
    }

    const cleanEmail = settings.email.trim().toLowerCase();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      Alert.alert("Invalid Email", "Valid email address enter karein.");
      return;
    }

    const normalizedSettings: AppSettings = {
      ...settings,
      companyName: settings.companyName.trim(),
      ownerName: settings.ownerName.trim(),
      mobile: cleanMobile,
      email: cleanEmail,
      address: settings.address.trim(),
    };

    setSaving(true);

    try {
      await saveSettings(normalizedSettings);
      setSettings(normalizedSettings);
      Alert.alert("Saved", "Settings successfully save ho gayi.");
    } catch {
      Alert.alert("Error", "Settings save nahi ho saki.");
    } finally {
      setSaving(false);
    }
  };


  const handleSaveSync = async () => {
    if (!syncConfig) return;
    const apiBaseUrl = syncConfig.apiBaseUrl.trim().replace(/\/$/, "");
    if (apiBaseUrl && !/^https?:\/\//i.test(apiBaseUrl)) {
      Alert.alert("Invalid API URL", "URL http:// ya https:// se start honi chahiye.");
      return;
    }
    await saveSyncConfig({ ...syncConfig, apiBaseUrl });
    Alert.alert("Saved", "Sync settings save ho gayi.");
  };

  const handleSyncNow = async () => {
    const result = await runSync();
    Alert.alert(result.success ? "Sync Complete" : result.queued ? "Saved Offline" : "Sync Required", result.message);
  };

  const handleCreateBackup = async () => {
    try {
      const backup = await createBackup();
      setBackupText(backup);

      await Share.share({
        title: "JMK Mobile CRM Backup",
        message: backup,
      });
    } catch {
      Alert.alert("Error", "Backup create nahi ho saka.");
    }
  };

  const handleRestore = () => {
    if (!backupText.trim()) {
      Alert.alert(
        "Backup Required",
        "Backup JSON text paste karein."
      );
      return;
    }

    Alert.alert(
      "Restore Backup",
      "Current matching CRM data replace ho sakta hai. Continue karein?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Restore",
          onPress: async () => {
            try {
              await restoreBackup(backupText);
              await loadSettings();
              Alert.alert(
                "Restored",
                "Backup successfully restore ho gaya."
              );
            } catch (error) {
              Alert.alert(
                "Invalid Backup",
                error instanceof Error
                  ? error.message
                  : "Backup restore nahi ho saka."
              );
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "JMK Mobile CRM se logout karna hai?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/login");
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      "Delete All CRM Data",
      "Customers, leads, bookings, finance aur doosra offline data delete ho jayega. Ye action undo nahi hoga.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            await clearAllCrmData();
            setBackupText("");
            await loadSettings();

            Alert.alert(
              "Data Cleared",
              "Offline CRM data delete ho gaya."
            );
          },
        },
      ]
    );
  };

  if (!settings) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader
          segment="Settings"
          onMenuPress={goHome}
          onNotificationPress={() => router.push("/notifications")}
          onProfilePress={goHome}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Loading settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader
        segment="Settings"
        onMenuPress={goHome}
        onNotificationPress={() => router.push("/notifications")}
        onProfilePress={goHome}
      />

      <View style={styles.navigationRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [
            styles.navigationButton,
            pressed && styles.navigationButtonPressed,
          ]}
          onPress={goBack}
        >
          <Text style={styles.navigationIcon}>‹</Text>
          <Text style={styles.navigationText}>Back</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to dashboard"
          style={({ pressed }) => [
            styles.homeButton,
            pressed && styles.navigationButtonPressed,
          ]}
          onPress={goHome}
        >
          <Text style={styles.homeIcon}>⌂</Text>
          <Text style={styles.homeText}>Home</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Enterprise Settings</Text>
        <Text style={styles.subtitle}>
          JMK Group profile, preferences aur offline backup manage karein.
        </Text>

        <Section title="Company Profile">
          <Field
            label="Company Name"
            value={settings.companyName}
            onChangeText={(value) =>
              updateField("companyName", value)
            }
          />

          <Field
            label="Owner Name"
            value={settings.ownerName}
            onChangeText={(value) =>
              updateField("ownerName", value)
            }
          />

          <Field
            label="Mobile Number"
            value={settings.mobile}
            keyboardType="phone-pad"
            onChangeText={(value) =>
              updateField("mobile", value)
            }
          />

          <Field
            label="Email"
            value={settings.email}
            keyboardType="email-address"
            onChangeText={(value) =>
              updateField("email", value)
            }
          />

          <Field
            label="Office Address"
            value={settings.address}
            multiline
            onChangeText={(value) =>
              updateField("address", value)
            }
          />
        </Section>

        <Section title="Default Business Segment">
          <View style={styles.segmentRow}>
            {SEGMENTS.map((segment) => {
              const selected =
                settings.defaultSegment === segment;

              return (
                <Pressable
                  key={segment}
                  style={[
                    styles.segmentButton,
                    selected && styles.segmentButtonSelected,
                  ]}
                  onPress={() =>
                    updateField("defaultSegment", segment)
                  }
                >
                  <Text
                    style={[
                      styles.segmentText,
                      selected && styles.segmentTextSelected,
                    ]}
                  >
                    {segment}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Preferences">
          <SettingSwitch
            label="Notifications"
            description="CRM reminders aur alerts enable rakhein."
            value={settings.notificationsEnabled}
            onValueChange={(value) =>
              updateField("notificationsEnabled", value)
            }
          />

          <SettingSwitch
            label="Dark Theme"
            description="Premium JMK dark interface."
            value={settings.darkMode}
            onValueChange={(value) =>
              updateField("darkMode", value)
            }
          />
        </Section>

        <Pressable
          style={styles.primaryButton}
          disabled={saving}
          onPress={() => void handleSave()}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? "Saving..." : "Save Settings"}
          </Text>
        </Pressable>


        <Section title="Website & CRM Sync">
          <Text style={styles.helperText}>
            Backend API ready hone ke baad uska secure base URL yahan enter karein.
          </Text>

          <Field
            label="API Base URL"
            value={syncConfig?.apiBaseUrl || ""}
            keyboardType="default"
            onChangeText={(value) =>
              syncConfig && void saveSyncConfig({ ...syncConfig, apiBaseUrl: value })
            }
          />

          <SettingSwitch
            label="Automatic Sync"
            description="App open hone par pending data sync karne ki setting."
            value={syncConfig?.autoSyncEnabled || false}
            onValueChange={(value) =>
              syncConfig && void saveSyncConfig({ ...syncConfig, autoSyncEnabled: value })
            }
          />

          <Text style={styles.syncStatus}>
            Last sync: {syncConfig?.lastSyncAt ? new Date(syncConfig.lastSyncAt).toLocaleString() : "Not synced"}
            {"\n"}Pending offline batches: {queueCount}
          </Text>

          <View style={styles.syncButtonRow}>
            <Pressable style={styles.secondaryButton} onPress={() => void handleSaveSync()}>
              <Text style={styles.secondaryButtonText}>Save Sync Settings</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} disabled={syncing} onPress={() => void handleSyncNow()}>
              <Text style={styles.primaryButtonText}>{syncing ? "Syncing..." : "Sync Now"}</Text>
            </Pressable>
          </View>
        </Section>

        <Section title="Backup & Restore">
          <Text style={styles.helperText}>
            Backup create karke JSON share karein. Restore ke liye wahi JSON
            neeche paste karein.
          </Text>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => void handleCreateBackup()}
          >
            <Text style={styles.secondaryButtonText}>
              Create & Share Backup
            </Text>
          </Pressable>

          <TextInput
            value={backupText}
            onChangeText={setBackupText}
            multiline
            placeholder="Backup JSON yahan paste karein..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.backupInput}
          />

          <Pressable
            style={styles.restoreButton}
            onPress={handleRestore}
          >
            <Text style={styles.restoreButtonText}>
              Restore Backup
            </Text>
          </Pressable>
        </Section>

        <SystemHealthCard />

        <Section title="Danger Zone">
          <Text style={styles.dangerDescription}>
            Pehle backup bana lena. Delete ke baad offline data wapas nahi aayega.
          </Text>

          <Pressable
            style={styles.dangerButton}
            onPress={handleClearData}
          >
            <Text style={styles.dangerButtonText}>
              Delete All Offline Data
            </Text>
          </Pressable>
        </Section>

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.navigationButtonPressed,
          ]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout from JMK CRM</Text>
        </Pressable>

        <Text style={styles.footer}>
          JMK CRM PRO Enterprise{"\n"}
          Developed By – Suresh Vishwakarma, Founder, JMK Group
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: PropsWithChildren<SectionProps>) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "phone-pad" | "email-address";
  multiline?: boolean;
};

function Field({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  multiline = false,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor={COLORS.textMuted}
        style={[
          styles.input,
          multiline && styles.multilineInput,
        ]}
      />
    </View>
  );
}

type SettingSwitchProps = {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function SettingSwitch({
  label,
  description,
  value,
  onValueChange,
}: SettingSwitchProps) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchTextContainer}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Text style={styles.switchDescription}>
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: COLORS.surfaceLight,
          true: COLORS.primary,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 48,
  },

  navigationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },

  navigationButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  navigationIcon: {
    color: COLORS.white,
    marginRight: 7,
    fontSize: 28,
    lineHeight: 29,
    fontWeight: "700",
  },

  navigationText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },

  homeButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },

  homeIcon: {
    color: COLORS.white,
    marginRight: 7,
    fontSize: 18,
    fontWeight: "900",
  },

  homeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },

  navigationButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: COLORS.textMuted,
  },

  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
  },

  subtitle: {
    color: COLORS.textMuted,
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
  },

  section: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  syncStatus: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 20,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },

  syncButtonRow: {
    gap: SPACING.sm,
  },

  sectionTitle: {
    color: COLORS.text,
    marginBottom: SPACING.md,
    fontSize: 15,
    fontWeight: "900",
  },

  field: {
    marginBottom: SPACING.md,
  },

  label: {
    color: COLORS.textMuted,
    marginBottom: 7,
    fontSize: 10,
    fontWeight: "800",
  },

  input: {
    minHeight: 48,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  multilineInput: {
    minHeight: 82,
    paddingTop: SPACING.md,
    textAlignVertical: "top",
  },

  segmentRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },

  segmentButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  segmentButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  segmentText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "900",
  },

  segmentTextSelected: {
    color: COLORS.white,
  },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },

  switchTextContainer: {
    flex: 1,
    paddingRight: SPACING.md,
  },

  switchLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },

  switchDescription: {
    color: COLORS.textMuted,
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
  },

  primaryButton: {
    alignItems: "center",
    marginTop: SPACING.lg,
    paddingVertical: 15,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },

  helperText: {
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    fontSize: 10,
    lineHeight: 16,
  },

  secondaryButton: {
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "900",
  },

  backupInput: {
    minHeight: 130,
    marginTop: SPACING.md,
    padding: SPACING.md,
    textAlignVertical: "top",
    borderRadius: RADIUS.md,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 10,
  },

  restoreButton: {
    alignItems: "center",
    marginTop: SPACING.md,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.info,
  },

  restoreButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "900",
  },

  dangerDescription: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 16,
  },

  dangerButton: {
    alignItems: "center",
    marginTop: SPACING.md,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.danger,
  },

  dangerButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "900",
  },

  logoutButton: {
    minHeight: 50,
    marginTop: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.45)",
    backgroundColor: "rgba(220,38,38,0.12)",
  },

  logoutButtonText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "800",
  },

  footer: {
    color: COLORS.textMuted,
    marginTop: SPACING.xl,
    textAlign: "center",
    fontSize: 9,
    lineHeight: 15,
  },
});
