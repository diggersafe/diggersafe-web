import { useCallback, useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getMachines,
  getSettings,
  INSPECTION_PHASES,
  ALL_CHECK_ITEMS,
  type Machine,
  type CheckResult,
  type SafetyCheck,
} from "@/lib/store";

function PhaseCheckItem({
  label,
  description,
  result,
  isCritical,
  notes,
  photoUri,
  onToggle,
  onNotesChange,
  onPhotoCapture,
}: {
  label: string;
  description: string;
  result: CheckResult;
  isCritical: boolean;
  notes: string;
  photoUri?: string;
  onToggle: (result: CheckResult) => void;
  onNotesChange: (notes: string) => void;
  onPhotoCapture: () => void;
}) {
  const colors = useColors();
  const showNotesField = result === "fail";

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor:
          result === "fail"
            ? colors.error + "60"
            : result === "pass"
            ? colors.success + "40"
            : colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
              {label}
            </Text>

          </View>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4, lineHeight: 17 }}>
            {description}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <TouchableOpacity
            onPress={() => onToggle("pass")}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: result === "pass" ? colors.success + "20" : "transparent",
              borderWidth: 1,
              borderColor: result === "pass" ? colors.success : colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 12,
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
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: result === "fail" ? colors.error + "20" : "transparent",
              borderWidth: 1,
              borderColor: result === "fail" ? colors.error : colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: result === "fail" ? colors.error : colors.muted,
              }}
            >
              Fail
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notes field - required on fail */}
      {showNotesField && (
        <View style={{ marginTop: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.error, marginBottom: 4 }}>
            {isCritical ? "⚠️ CRITICAL FAIL — Comment & photo required (machine will be grounded)" : "Comment required for failed item"}
          </Text>
          <TextInput
            value={notes}
            onChangeText={onNotesChange}
            placeholder="Describe the issue..."
            placeholderTextColor={colors.muted + "80"}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: colors.background,
              borderRadius: 8,
              padding: 10,
              fontSize: 13,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.error + "40",
              minHeight: 60,
              textAlignVertical: "top",
            }}
          />
          {/* Photo evidence */}
          <TouchableOpacity
            onPress={onPhotoCapture}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 8,
              backgroundColor: photoUri ? colors.success + "15" : colors.error + "10",
              borderRadius: 8,
              padding: 10,
              borderWidth: 1,
              borderColor: photoUri ? colors.success + "40" : colors.error + "30",
              borderStyle: "dashed",
            }}
          >
            <MaterialIcons
              name={photoUri ? "check-circle" : "camera-alt"}
              size={20}
              color={photoUri ? colors.success : colors.error}
            />
            <Text style={{ fontSize: 13, color: photoUri ? colors.success : colors.error, marginLeft: 8, fontWeight: "500" }}>
              {photoUri ? "Photo attached" : (isCritical ? "Take photo (required)" : "Take photo (optional)")}
            </Text>
          </TouchableOpacity>
          {photoUri && (
            <Image source={{ uri: photoUri }} style={{ width: "100%", height: 120, borderRadius: 8, marginTop: 8 }} resizeMode="cover" />
          )}
        </View>
      )}
    </View>
  );
}

export default function InspectionScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [hourMeter, setHourMeter] = useState("");
  const [currentPhase, setCurrentPhase] = useState(0); // 0 = hour meter, 1-3 = phases
  const [checks, setChecks] = useState<SafetyCheck[]>(
    ALL_CHECK_ITEMS.map((item) => ({
      category: item.label,
      phase: item.phase,
      result: "pending" as CheckResult,
      notes: "",
      isCritical: item.isCritical,
    }))
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

  const handleToggle = (checkIndex: number, result: CheckResult) => {
    setChecks((prev) => {
      const updated = [...prev];
      updated[checkIndex] = { ...updated[checkIndex], result, notes: result === "pass" ? "" : updated[checkIndex].notes };
      return updated;
    });
  };

  const handleNotesChange = (checkIndex: number, notes: string) => {
    setChecks((prev) => {
      const updated = [...prev];
      updated[checkIndex] = { ...updated[checkIndex], notes };
      return updated;
    });
  };

  const handlePhotoCapture = async (checkIndex: number) => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Camera Permission", "Camera access is needed to take evidence photos.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets[0]) {
        setChecks((prev) => {
          const updated = [...prev];
          updated[checkIndex] = { ...updated[checkIndex], photoUri: result.assets[0].uri };
          return updated;
        });
      }
    } else {
      // On web, use image library picker instead of camera
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.7,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets[0]) {
        setChecks((prev) => {
          const updated = [...prev];
          updated[checkIndex] = { ...updated[checkIndex], photoUri: result.assets[0].uri };
          return updated;
        });
      }
    }
  };

  // Get checks for current phase
  const currentPhaseData = INSPECTION_PHASES[currentPhase - 1];
  const currentPhaseChecks = currentPhase > 0
    ? checks.filter((c) => c.phase === currentPhase)
    : [];

  const phaseAllChecked = currentPhaseChecks.every((c) => c.result !== "pending");
  const phaseFailedItems = currentPhaseChecks.filter((c) => c.result === "fail");
  const phaseFailsNeedNotes = phaseFailedItems.every((c) => c.notes.trim().length > 0);
  const phaseCriticalFailsHavePhotos = phaseFailedItems.filter((c) => c.isCritical).every((c) => c.photoUri);
  const canAdvancePhase = phaseAllChecked && (phaseFailedItems.length === 0 || (phaseFailsNeedNotes && phaseCriticalFailsHavePhotos));

  const allChecked = checks.every((c) => c.result !== "pending");
  const hasCriticalFails = checks.some((c) => c.result === "fail" && c.isCritical);
  const allFailsHaveNotes = checks.filter((c) => c.result === "fail").every((c) => c.notes.trim().length > 0);

  const handleNextPhase = () => {
    if (currentPhase === 0) {
      // Validate hour meter
      const hours = parseInt(hourMeter);
      if (!hours || hours <= 0) {
        Alert.alert("Hour Meter Required", "Please enter a valid engine hour reading.");
        return;
      }
      setCurrentPhase(1);
    } else if (currentPhase < 3) {
      if (!canAdvancePhase) {
        Alert.alert("Incomplete", "All items must be checked. Failed items require a comment. Critical fails also require a photo.");
        return;
      }
      setCurrentPhase(currentPhase + 1);
    } else {
      // Final phase complete — go to signature
      if (!canAdvancePhase) {
        Alert.alert("Incomplete", "All items must be checked. Failed items require a comment. Critical fails also require a photo.");
        return;
      }
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!machine) return;

    const settings = await getSettings();
    const cleared = !checks.some((c) => c.result === "fail");
    const groundedReason = hasCriticalFails
      ? checks
          .filter((c) => c.result === "fail" && c.isCritical)
          .map((c) => `${c.category}: ${c.notes}`)
          .join("; ")
      : undefined;

    const inspection = {
      machineId: machine.id,
      assetId: machine.assetId,
      makeModel: machine.makeModel,
      date: new Date().toISOString().split("T")[0],
      timestamp: new Date().toISOString(),
      operator: settings.operatorName,
      hourMeter: parseInt(hourMeter) || machine.hourMeter,
      checks,
      signatureBase64: "",
      cleared,
      groundedReason,
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

  // Total progress across all phases
  const totalCompleted = checks.filter((c) => c.result !== "pending").length;
  const totalItems = checks.length;

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          <Text style={{ fontSize: 16, color: colors.foreground, marginLeft: 8 }}>Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>
          Pre-Hire Check
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 4 }}>
          {machine.assetId} — {machine.makeModel}
        </Text>

        {/* Overall progress bar */}
        <View style={{ marginBottom: 16, marginTop: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: 11, color: colors.muted }}>
              Overall Progress
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted }}>
              {totalCompleted}/{totalItems}
            </Text>
          </View>
          <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2 }}>
            <View
              style={{
                height: 4,
                backgroundColor: colors.primary,
                borderRadius: 2,
                width: `${(totalCompleted / totalItems) * 100}%`,
              }}
            />
          </View>
        </View>

        {/* Phase 0: Hour Meter */}
        {currentPhase === 0 && (
          <View>
            <View
              style={{
                backgroundColor: colors.primary + "15",
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: colors.primary + "30",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary, marginBottom: 4 }}>
                WorkSafe Compliance
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
                Engine hour reading is compulsory for aligning this precheck with service records. GPS location and timestamp will be recorded automatically.
              </Text>
            </View>

            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.muted,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Engine Hour Meter Reading *
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
                fontSize: 22,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
                fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
              }}
            />
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 6 }}>
              Previous reading: {machine.hourMeter} hrs
            </Text>
          </View>
        )}

        {/* Phases 1-3 */}
        {currentPhase > 0 && currentPhaseData && (
          <View>
            {/* Phase header */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
                borderLeftWidth: 4,
                borderLeftColor: colors.primary,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                {currentPhaseData.title}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                {currentPhaseData.subtitle}
              </Text>
            </View>

            {/* Phase step indicator */}
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 16 }}>
              {[1, 2, 3].map((phase) => (
                <View
                  key={phase}
                  style={{
                    width: phase === currentPhase ? 32 : 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor:
                      phase < currentPhase
                        ? colors.success
                        : phase === currentPhase
                        ? colors.primary
                        : colors.border,
                  }}
                />
              ))}
            </View>

            {/* Check items for this phase */}
            {currentPhaseData.items.map((item) => {
              const checkIndex = checks.findIndex(
                (c) => c.category === item.label && c.phase === item.phase
              );
              const check = checks[checkIndex];
              if (!check) return null;

              return (
                <PhaseCheckItem
                  key={item.id}
                  label={item.label}
                  description={item.description}
                  result={check.result}
                  isCritical={item.isCritical}
                  notes={check.notes}
                  photoUri={check.photoUri}
                  onToggle={(result) => handleToggle(checkIndex, result)}
                  onNotesChange={(notes) => handleNotesChange(checkIndex, notes)}
                  onPhotoCapture={() => handlePhotoCapture(checkIndex)}
                />
              );
            })}

            {/* Phase progress */}
            <View style={{ marginTop: 4, marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center" }}>
                {currentPhaseChecks.filter((c) => c.result !== "pending").length} / {currentPhaseChecks.length} items checked
              </Text>
            </View>

            {/* Critical fail warning */}
            {phaseFailedItems.some((c) => c.isCritical) && (
              <View
                style={{
                  backgroundColor: colors.error + "15",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: colors.error + "30",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <MaterialIcons name="warning" size={20} color={colors.error} />
                <Text style={{ fontSize: 12, color: colors.error, flex: 1, lineHeight: 17 }}>
                  Critical fail detected. Machine will be automatically grounded. Comment is mandatory.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Next/Submit Button */}
        <TouchableOpacity
          onPress={handleNextPhase}
          activeOpacity={0.8}
          disabled={currentPhase > 0 && !canAdvancePhase}
          style={{
            backgroundColor:
              currentPhase === 0 || canAdvancePhase ? colors.primary : colors.muted + "30",
            borderRadius: 14,
            padding: 18,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            marginTop: 12,
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: currentPhase === 0 || canAdvancePhase ? "#1A1A1A" : colors.muted,
            }}
          >
            {currentPhase === 0
              ? "Begin Inspection"
              : currentPhase < 3
              ? `Next: Phase ${currentPhase + 1}`
              : "Next: Signature"}
          </Text>
          <MaterialIcons
            name="chevron-right"
            size={22}
            color={currentPhase === 0 || canAdvancePhase ? "#1A1A1A" : colors.muted}
          />
        </TouchableOpacity>

        {/* Back to previous phase */}
        {currentPhase > 0 && (
          <TouchableOpacity
            onPress={() => setCurrentPhase(currentPhase - 1)}
            activeOpacity={0.7}
            style={{
              padding: 14,
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.muted }}>
              {currentPhase === 1 ? "← Back to Hour Meter" : `← Back to Phase ${currentPhase - 1}`}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
