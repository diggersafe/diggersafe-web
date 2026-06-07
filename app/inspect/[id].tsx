import { useCallback, useState } from "react";
import { Text, View, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getMachines,
  getSettings,
  saveInspection,
  SAFETY_CATEGORIES,
  type Machine,
  type CheckResult,
  type SafetyCheck,
} from "@/lib/store";

function CheckItem({
  category,
  result,
  onToggle,
}: {
  category: string;
  result: CheckResult;
  onToggle: (result: CheckResult) => void;
}) {
  const colors = useColors();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 15, fontWeight: "500", color: colors.foreground, flex: 1, marginRight: 12 }}>
          {category}
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => onToggle("pass")}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: result === "pass" ? colors.success + "20" : "transparent",
              borderWidth: 1,
              borderColor: result === "pass" ? colors.success : colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: result === "pass" ? colors.success : colors.muted,
              }}
            >
              Pass
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onToggle("fail")}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: result === "fail" ? colors.error + "20" : "transparent",
              borderWidth: 1,
              borderColor: result === "fail" ? colors.error : colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: result === "fail" ? colors.error : colors.muted,
              }}
            >
              Fail
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function InspectionScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [hourMeter, setHourMeter] = useState("");
  const [checks, setChecks] = useState<SafetyCheck[]>(
    SAFETY_CATEGORIES.map((cat) => ({ category: cat, result: "pending" as CheckResult, notes: "" }))
  );

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const machines = await getMachines();
        const found = machines.find((m) => m.id === id);
        if (found) {
          setMachine(found);
          setHourMeter(found.hourMeter.toString());
        }
      })();
    }, [id])
  );

  const allChecked = checks.every((c) => c.result !== "pending");
  const allPassed = checks.every((c) => c.result === "pass");

  const handleToggle = (index: number, result: CheckResult) => {
    setChecks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], result };
      return updated;
    });
  };

  const handleNext = async () => {
    if (!machine || !allChecked) return;

    const settings = await getSettings();
    const inspection = {
      machineId: machine.id,
      assetId: machine.assetId,
      makeModel: machine.makeModel,
      date: new Date().toISOString(),
      inspector: settings.inspectorName,
      hourMeter: parseInt(hourMeter) || machine.hourMeter,
      checks,
      signatureBase64: "",
      cleared: allPassed,
    };

    // Navigate to signature screen with inspection data
    router.push({
      pathname: "/signature" as any,
      params: { inspectionData: JSON.stringify(inspection) },
    });
  };

  if (!machine) {
    return (
      <ScreenContainer className="p-4">
        <Text style={{ color: colors.foreground }}>Loading...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          <Text style={{ fontSize: 16, color: colors.foreground, marginLeft: 8 }}>Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground }}>
          Pre-Hire Check
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 20 }}>
          {machine.assetId} — {machine.makeModel}
        </Text>

        {/* Hour Meter */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Hour Meter Reading
          </Text>
          <TextInput
            value={hourMeter}
            onChangeText={setHourMeter}
            placeholder="Enter current hours"
            placeholderTextColor={colors.muted + "80"}
            keyboardType="numeric"
            returnKeyType="done"
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 14,
              fontSize: 18,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
              fontFamily: "monospace",
            }}
          />
        </View>

        {/* Safety Checks */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Safety Checks
        </Text>

        {checks.map((check, index) => (
          <CheckItem
            key={check.category}
            category={check.category}
            result={check.result}
            onToggle={(result) => handleToggle(index, result)}
          />
        ))}

        {/* Progress indicator */}
        <View style={{ marginTop: 8, marginBottom: 16 }}>
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
            {checks.filter((c) => c.result !== "pending").length} / {checks.length} completed
          </Text>
        </View>

        {/* Next Button */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          disabled={!allChecked}
          style={{
            backgroundColor: allChecked ? colors.primary : colors.muted + "30",
            borderRadius: 14,
            padding: 18,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: "700", color: allChecked ? "#1A1A1A" : colors.muted }}>
            Next: Signature
          </Text>
          <MaterialIcons name="chevron-right" size={22} color={allChecked ? "#1A1A1A" : colors.muted} />
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
