import { Text, View, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function InspectionCompleteScreen() {
  const colors = useColors();
  const router = useRouter();
  const { inspectionId, cleared } = useLocalSearchParams<{ inspectionId: string; cleared: string }>();
  const isCleared = cleared === "true";

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {/* Status Card */}
        <View
          style={{
            backgroundColor: isCleared ? colors.success + "15" : colors.error + "15",
            borderRadius: 24,
            padding: 40,
            alignItems: "center",
            width: "100%",
            borderWidth: 2,
            borderColor: isCleared ? colors.success + "30" : colors.error + "30",
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: isCleared ? colors.success + "20" : colors.error + "20",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              borderWidth: 3,
              borderColor: isCleared ? colors.success : colors.error,
            }}
          >
            <MaterialIcons
              name={isCleared ? "check" : "close"}
              size={44}
              color={isCleared ? colors.success : colors.error}
            />
          </View>

          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground, textAlign: "center" }}>
            {isCleared ? "MACHINE CLEARED" : "INSPECTION FAILED"}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: isCleared ? colors.success : colors.error,
              marginTop: 6,
            }}
          >
            {isCleared ? "READY FOR HIRE" : "REQUIRES ATTENTION"}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={{ width: "100%", marginTop: 32, gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push(`/report/${inspectionId}` as any)}
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <MaterialIcons name="description" size={20} color={colors.foreground} />
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              View Report
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/(tabs)" as any)}
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 14,
              padding: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <MaterialIcons name="arrow-back" size={20} color="#1A1A1A" />
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1A1A1A" }}>
              Back to Fleet
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
