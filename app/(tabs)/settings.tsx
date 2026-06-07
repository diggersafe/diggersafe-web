import { useCallback, useState } from "react";
import { Text, View, TextInput, TouchableOpacity, Alert, Platform } from "react-native";
import { useFocusEffect } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getSettings, saveSettings, type AppSettings } from "@/lib/store";

export default function SettingsScreen() {
  const colors = useColors();
  const [settings, setSettings] = useState<AppSettings>({ inspectorName: "", companyName: "" });
  const [saved, setSaved] = useState(false);

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

  return (
    <ScreenContainer className="px-4 pt-2">
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 32, fontWeight: "800", color: colors.foreground }}>Settings</Text>
        <Text style={{ fontSize: 14, color: colors.muted }}>Configure your inspector details</Text>
      </View>

      <View style={{ gap: 20 }}>
        <View>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Inspector Name
          </Text>
          <TextInput
            value={settings.inspectorName}
            onChangeText={(text) => setSettings((s) => ({ ...s, inspectorName: text }))}
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
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
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
            marginTop: 8,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#1A1A1A" }}>
            {saved ? "Saved ✓" : "Save Settings"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 40, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
          DiggerSafe Fleet & Safety v1.0.0
        </Text>
      </View>
    </ScreenContainer>
  );
}
