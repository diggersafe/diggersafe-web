import { useCallback, useState } from "react";
import { Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Platform, Linking } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getSettings, saveSettings, deleteAllData, type AppSettings } from "@/lib/store";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useCloudSync } from "@/hooks/use-cloud-sync";

function SettingsRow({
  icon,
  label,
  subtitle,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: danger ? colors.error + "30" : colors.border,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          backgroundColor: danger ? colors.error + "15" : colors.primary + "15",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <MaterialIcons name={icon as any} size={20} color={danger ? colors.error : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: danger ? colors.error : colors.foreground }}>
          {label}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{subtitle}</Text>
        )}
      </View>
      <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>({ operatorName: "", companyName: "" });
  const [saved, setSaved] = useState(false);
  const { status, daysRemaining, isActive } = useSubscription();
  const { isAuthenticated } = useAuth();
  const { syncing, lastSyncAt, error: syncError, pushToCloud, pullFromCloud } = useCloudSync();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const data = await getSettings();
        setSettings(data);
      })();
    }, [])
  );

  const handleSave = async () => {
    await saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (Platform.OS !== "web") {
      const Haptics = await import("expo-haptics");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleDeleteData = () => {
    Alert.alert(
      "Delete All Data",
      "This will permanently delete all your machines, inspection records, service records, and settings. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            await deleteAllData();
            if (Platform.OS !== "web") {
              const Haptics = await import("expo-haptics");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            Alert.alert("Data Deleted", "All app data has been removed. The app will now reset.", [
              { text: "OK", onPress: () => router.replace("/onboarding" as any) },
            ]);
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 32, fontWeight: "800", color: colors.foreground }}>Settings</Text>
          <Text style={{ fontSize: 14, color: colors.muted }}>Configure your operator details</Text>
        </View>

        {/* Operator Details */}
        <View style={{ gap: 16, marginBottom: 32 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Operator Details
          </Text>
          <View>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6 }}>
              Operator Name
            </Text>
            <TextInput
              value={settings.operatorName}
              onChangeText={(text) => setSettings((s) => ({ ...s, operatorName: text }))}
              placeholder="Enter your name"
              placeholderTextColor={colors.muted + "80"}
              returnKeyType="done"
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 14,
                fontSize: 16,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          </View>

          <View>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6 }}>
              Company Name
            </Text>
            <TextInput
              value={settings.companyName}
              onChangeText={(text) => setSettings((s) => ({ ...s, companyName: text }))}
              placeholder="Enter company name"
              placeholderTextColor={colors.muted + "80"}
              returnKeyType="done"
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 14,
                fontSize: 16,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          </View>

          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1A1A1A" }}>
              {saved ? "Saved \u2713" : "Save Settings"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subscription & Account */}
        <View style={{ gap: 10, marginBottom: 32 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
            Subscription & Account
          </Text>
          <SettingsRow
            icon="verified"
            label="DiggerSafe Pro"
            subtitle={
              status === "active"
                ? "Active subscription"
                : status === "trial"
                ? `Trial: ${daysRemaining ?? 0} days remaining`
                : status === "expired"
                ? "Expired — read-only mode"
                : isAuthenticated
                ? "Manage your subscription"
                : "Sign in to manage subscription"
            }
            onPress={() => router.push("/subscribe" as any)}
          />
          {isAuthenticated && (
            <SettingsRow
              icon="cloud-upload"
              label={syncing ? "Syncing..." : "Sync Now"}
              subtitle={
                syncError
                  ? `Error: ${syncError}`
                  : lastSyncAt
                  ? `Last synced: ${new Date(lastSyncAt).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`
                  : "Tap to backup your data to the cloud"
              }
              onPress={() => pushToCloud()}
            />
          )}
          {isAuthenticated && (
            <SettingsRow
              icon="cloud-download"
              label="Restore from Cloud"
              subtitle="Download your data from a previous backup"
              onPress={() => {
                Alert.alert(
                  "Restore from Cloud",
                  "This will download any records from your cloud backup that are not on this device. Your existing local data will not be overwritten.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Restore", onPress: () => pullFromCloud() },
                  ]
                );
              }}
            />
          )}
        </View>

        {/* Legal & Support */}
        <View style={{ gap: 10, marginBottom: 32 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
            Legal & Support
          </Text>
          <SettingsRow
            icon="policy"
            label="Privacy Policy"
            subtitle="How we handle your data"
            onPress={() => router.push("/privacy-policy" as any)}
          />
          <SettingsRow
            icon="description"
            label="Terms of Service"
            subtitle="Usage terms and conditions"
            onPress={() => router.push("/terms-of-service" as any)}
          />
          <SettingsRow
            icon="email"
            label="Contact Support"
            subtitle="Get help with DiggerSafe"
            onPress={() => Linking.openURL("mailto:support@diggersafe.com.au")}
          />
        </View>

        {/* Danger Zone */}
        <View style={{ gap: 10, marginBottom: 32 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.error, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
            Danger Zone
          </Text>
          <SettingsRow
            icon="delete-forever"
            label="Delete All Data"
            subtitle="Permanently remove all records and reset the app"
            onPress={handleDeleteData}
            danger
          />
        </View>

        {/* Footer */}
        <View style={{ paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
            DiggerSafe Fleet & Safety v1.0.0
          </Text>
          <Text style={{ fontSize: 11, color: colors.muted + "80", textAlign: "center", marginTop: 4 }}>
            WorkSafe compliant Pre-Start inspections
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

