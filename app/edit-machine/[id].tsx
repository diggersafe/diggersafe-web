import { useCallback, useState } from "react";
import { Text, View, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getMachines, updateMachine, type Machine } from "@/lib/store";

export default function EditMachineScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [assetId, setAssetId] = useState("");
  const [makeModel, setMakeModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [hourMeter, setHourMeter] = useState("");
  const [status, setStatus] = useState<"active" | "retired">("active");
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const machines = await getMachines();
        const found = machines.find((m) => m.id === id);
        if (found) {
          setAssetId(found.assetId);
          setMakeModel(found.makeModel);
          setSerialNumber(found.serialNumber);
          setHourMeter(found.hourMeter.toString());
          setStatus(found.status);
        }
      })();
    }, [id])
  );

  const canSave = assetId.trim() && makeModel.trim() && serialNumber.trim();

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await updateMachine(id!, {
        assetId: assetId.trim(),
        makeModel: makeModel.trim(),
        serialNumber: serialNumber.trim(),
        hourMeter: parseInt(hourMeter) || 0,
        status,
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
          Edit Machine
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

          {/* Status Toggle */}
          <View>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Status
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setStatus("active")}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: status === "active" ? colors.success + "20" : colors.surface,
                  borderWidth: 1,
                  borderColor: status === "active" ? colors.success : colors.border,
                }}
              >
                <Text style={{ fontWeight: "600", color: status === "active" ? colors.success : colors.muted }}>
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setStatus("retired")}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: status === "retired" ? colors.muted + "20" : colors.surface,
                  borderWidth: 1,
                  borderColor: status === "retired" ? colors.muted : colors.border,
                }}
              >
                <Text style={{ fontWeight: "600", color: colors.muted }}>Retired</Text>
              </TouchableOpacity>
            </View>
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
            {saving ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
