import { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { saveSettings, completeOnboarding } from "@/lib/store";

export default function OnboardingScreen() {
  const colors = useColors();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [operatorName, setOperatorName] = useState("");
  const [companyName, setCompanyName] = useState("");

  const handleComplete = async () => {
    await saveSettings({ operatorName: operatorName.trim(), companyName: companyName.trim() });
    await completeOnboarding();
    if (Platform.OS !== "web") {
      const Haptics = await import("expo-haptics");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.replace("/(tabs)");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
              <Image
                source={require("@/assets/images/icon.png")}
                style={{ width: 100, height: 100, borderRadius: 24, marginBottom: 24 }}
              />
              <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground, textAlign: "center" }}>
                Welcome to{"\n"}
                <Text style={{ color: colors.success }}>Digger</Text>
                <Text style={{ color: colors.foreground }}>Safe</Text>
              </Text>
              <Text style={{ fontSize: 15, color: colors.muted, textAlign: "center", marginTop: 12, lineHeight: 22 }}>
                WorkSafe-compliant pre-hire inspections{"\n"}for your fleet
              </Text>

              <View style={{ marginTop: 40, width: "100%" }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.success + "20", alignItems: "center", justifyContent: "center" }}>
                    <MaterialIcons name="check-circle" size={22} color={colors.success} />
                  </View>
                  <Text style={{ fontSize: 14, color: colors.foreground, marginLeft: 12 }}>3-phase WorkSafe pre-hire checks</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center" }}>
                    <MaterialIcons name="gps-fixed" size={22} color={colors.primary} />
                  </View>
                  <Text style={{ fontSize: 14, color: colors.foreground, marginLeft: 12 }}>GPS & timestamp compliance logging</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.warning + "20", alignItems: "center", justifyContent: "center" }}>
                    <MaterialIcons name="qr-code" size={22} color={colors.warning} />
                  </View>
                  <Text style={{ fontSize: 14, color: colors.foreground, marginLeft: 12 }}>QR stickers for quick machine access</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setStep(1)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 14,
                  paddingVertical: 16,
                  paddingHorizontal: 32,
                  marginTop: 40,
                  width: "100%",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 17, fontWeight: "700", color: "#1A1A1A" }}>Get Started</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 1: Operator Details */}
          {step === 1 && (
            <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 32 }}>
              <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground, marginBottom: 8 }}>
                Your Details
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 32 }}>
                This info appears on every inspection report.
              </Text>

              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Operator Name
                </Text>
                <TextInput
                  value={operatorName}
                  onChangeText={setOperatorName}
                  placeholder="e.g. Darren Gray"
                  placeholderTextColor={colors.muted + "80"}
                  returnKeyType="next"
                  autoFocus
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

              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Company Name
                </Text>
                <TextInput
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="e.g. Gray's Earthmoving"
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
                onPress={handleComplete}
                activeOpacity={0.8}
                disabled={!operatorName.trim() || !companyName.trim()}
                style={{
                  backgroundColor: operatorName.trim() && companyName.trim() ? colors.primary : colors.surface,
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: "center",
                  opacity: operatorName.trim() && companyName.trim() ? 1 : 0.5,
                }}
              >
                <Text style={{ fontSize: 17, fontWeight: "700", color: operatorName.trim() && companyName.trim() ? "#1A1A1A" : colors.muted }}>
                  Start Using DiggerSafe
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStep(0)}
                activeOpacity={0.7}
                style={{ marginTop: 16, alignItems: "center" }}
              >
                <Text style={{ fontSize: 14, color: colors.muted }}>Back</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
