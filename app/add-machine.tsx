import { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { addMachine } from "@/lib/store";

export default function AddMachineScreen() {
  const colors = useColors();
  const router = useRouter();
  const [assetId, setAssetId] = useState("");
  const [makeModel, setMakeModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [hourMeter, setHourMeter] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = assetId.trim() && makeModel.trim() && serialNumber.trim();

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await addMachine({
        assetId: assetId.trim(),
        makeModel: makeModel.trim(),
        serialNumber: serialNumber.trim(),
        hourMeter: parseInt(hourMeter) || 0,
        status: "active",
      });
      if (Platform.OS !== "web") {
        const Haptics = await import("expo-haptics");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    } catch {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          <Text style={{ fontSize: 16, color: colors.foreground, marginLeft: 8 }}>Cancel</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground, marginBottom: 24 }}>
          Add Machine
        </Text>

        <View style={{ gap: 18 }}>
          <View>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Asset ID *
            </Text>
            <TextInput
              value={assetId}
              onChangeText={setAssetId}
              placeholder="e.g. DIG-001"
              placeholderTextColor={colors.muted + "80"}
              autoCapitalize="characters"
              returnKeyType="next"
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
              Make / Model *
            </Text>
            <TextInput
              value={makeModel}
              onChangeText={setMakeModel}
              placeholder="e.g. CAT 320F Excavator"
              placeholderTextColor={colors.muted + "80"}
              returnKeyType="next"
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
              Serial Number *
            </Text>
            <TextInput
              value={serialNumber}
              onChangeText={setSerialNumber}
              placeholder="e.g. CAT0320F78921"
              placeholderTextColor={colors.muted + "80"}
              autoCapitalize="characters"
              returnKeyType="next"
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
              Hour Meter
            </Text>
            <TextInput
              value={hourMeter}
              onChangeText={setHourMeter}
              placeholder="0"
              placeholderTextColor={colors.muted + "80"}
              keyboardType="numeric"
              returnKeyType="done"
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 14,
                fontSize: 16,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
                fontFamily: "monospace",
              }}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={!canSave || saving}
          style={{
            backgroundColor: canSave ? colors.primary : colors.muted + "30",
            borderRadius: 14,
            padding: 18,
            alignItems: "center",
            marginTop: 32,
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: "700", color: canSave ? "#1A1A1A" : colors.muted }}>
            {saving ? "Saving..." : "Save Machine"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
