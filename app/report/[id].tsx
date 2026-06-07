import { useCallback, useState } from "react";
import { Text, View, TouchableOpacity, ScrollView } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Svg, { Path } from "react-native-svg";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getInspections, type Inspection } from "@/lib/store";

export default function ReportScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [inspection, setInspection] = useState<Inspection | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const inspections = await getInspections();
        const found = inspections.find((i) => i.id === id);
        setInspection(found || null);
      })();
    }, [id])
  );

  if (!inspection) {
    return (
      <ScreenContainer className="p-4">
        <Text style={{ color: colors.foreground }}>Loading...</Text>
      </ScreenContainer>
    );
  }

  const dateStr = new Date(inspection.date).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  let signaturePaths: string[] = [];
  try {
    signaturePaths = JSON.parse(inspection.signatureBase64);
  } catch {}

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

        {/* Report Card */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {/* Branding Header */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <MaterialIcons name="construction" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground }}>
                <Text style={{ color: colors.success }}>Digger</Text>Safe
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, letterSpacing: 1 }}>FLEET & SAFETY</Text>
            </View>
          </View>

          {/* Inspection Summary */}
          <View style={{ flexDirection: "row", marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase" }}>
                Date
              </Text>
              <Text style={{ fontSize: 15, fontWeight: "500", color: colors.foreground, marginTop: 2 }}>
                {dateStr}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase" }}>
                Inspector
              </Text>
              <Text style={{ fontSize: 15, fontWeight: "500", color: colors.foreground, marginTop: 2 }}>
                {inspection.inspector}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase" }}>
                Asset ID
              </Text>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground, marginTop: 2 }}>
                {inspection.assetId}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase" }}>
                Make/Model
              </Text>
              <Text style={{ fontSize: 15, fontWeight: "500", color: colors.foreground, marginTop: 2 }}>
                {inspection.makeModel}
              </Text>
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase" }}>
              Hour Meter
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginTop: 2, fontFamily: "monospace" }}>
              {inspection.hourMeter} hrs
            </Text>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16 }} />

          {/* Safety Checks */}
          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase", marginBottom: 10, letterSpacing: 0.5 }}>
            Safety Checks
          </Text>

          {inspection.checks.map((check, index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 10,
                borderBottomWidth: index < inspection.checks.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 14, color: colors.foreground, flex: 1 }}>
                {check.category}
              </Text>
              <View
                style={{
                  backgroundColor: check.result === "pass" ? colors.success + "20" : colors.error + "20",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: check.result === "pass" ? colors.success : colors.error,
                  }}
                >
                  {check.result === "pass" ? "Pass" : "Fail"}
                </Text>
              </View>
            </View>
          ))}

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />

          {/* Signature */}
          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase", marginBottom: 10, letterSpacing: 0.5 }}>
            Signature
          </Text>

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              height: 120,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Svg width="100%" height={120}>
              {signaturePaths.map((p, i) => (
                <Path key={i} d={p} stroke="#1A1A1A" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </Svg>
          </View>
        </View>

        {/* Back to Fleet */}
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
            marginTop: 20,
          }}
        >
          <MaterialIcons name="arrow-back" size={20} color="#1A1A1A" />
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#1A1A1A" }}>Back to Fleet</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
