import { useCallback, useState } from "react";
import { Text, View, TouchableOpacity, ScrollView } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import QRCode from "react-native-qrcode-svg";
import { Image } from "expo-image";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getMachines, type Machine } from "@/lib/store";

export default function QRTagScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [machine, setMachine] = useState<Machine | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const machines = await getMachines();
        const found = machines.find((m) => m.id === id);
        setMachine(found || null);
      })();
    }, [id])
  );

  if (!machine) {
    return (
      <ScreenContainer className="p-4">
        <Text style={{ color: colors.foreground }}>Loading...</Text>
      </ScreenContainer>
    );
  }

  const qrData = JSON.stringify({
    app: "diggersafe",
    machineId: machine.id,
    assetId: machine.assetId,
    serialNumber: machine.serialNumber,
  });

  return (
    <ScreenContainer className="px-4 pt-2" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          <Text style={{ fontSize: 16, color: colors.foreground, marginLeft: 8 }}>Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground, textAlign: "center" }}>
          QR Sticker
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 4, marginBottom: 24 }}>
          Print and attach to the machine
        </Text>

        {/* === STICKER DESIGN === */}
        <View
          style={{
            alignSelf: "center",
            width: 300,
            borderRadius: 24,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          {/* Top Banner - DiggerSafe Branding */}
          <View
            style={{
              backgroundColor: "#1A1A1A",
              paddingVertical: 16,
              paddingHorizontal: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              borderBottomWidth: 3,
              borderBottomColor: "#F5C518",
            }}
          >
            <Image
              source={require("@/assets/images/icon.png")}
              style={{ width: 36, height: 36, borderRadius: 8, marginRight: 10 }}
            />
            <View>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#FFFFFF" }}>
                <Text style={{ color: "#4CAF50" }}>Digger</Text>
                <Text style={{ color: "#FFFFFF" }}>Safe</Text>
              </Text>
              <Text style={{ fontSize: 9, color: "#9CA3AF", letterSpacing: 2, fontWeight: "600" }}>
                FLEET & SAFETY
              </Text>
            </View>
          </View>

          {/* QR Code Section - White Background */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              paddingVertical: 24,
              paddingHorizontal: 20,
              alignItems: "center",
            }}
          >
            {/* QR Code with yellow border */}
            <View
              style={{
                borderWidth: 4,
                borderColor: "#F5C518",
                borderRadius: 16,
                padding: 12,
                backgroundColor: "#FFFFFF",
              }}
            >
              <QRCode
                value={qrData}
                size={160}
                color="#1A1A1A"
                backgroundColor="#FFFFFF"
              />
            </View>

            {/* Machine Info */}
            <View style={{ marginTop: 16, alignItems: "center" }}>
              <Text style={{ fontSize: 22, fontWeight: "900", color: "#1A1A1A", letterSpacing: 1 }}>
                {machine.assetId}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#4B5563", marginTop: 4 }}>
                {machine.makeModel}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 6,
                  backgroundColor: "#F3F4F6",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}
              >
                <MaterialIcons name="tag" size={12} color="#6B7280" />
                <Text style={{ fontSize: 11, color: "#6B7280", marginLeft: 4, fontFamily: "monospace" }}>
                  {machine.serialNumber}
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Banner - Be WorkSafe */}
          <View
            style={{
              backgroundColor: "#F5C518",
              paddingVertical: 14,
              paddingHorizontal: 20,
              alignItems: "center",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="verified" size={18} color="#1A1A1A" />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "900",
                  color: "#1A1A1A",
                  marginLeft: 6,
                  letterSpacing: 1.5,
                }}
              >
                BE WORKSAFE
              </Text>
            </View>
            <Text style={{ fontSize: 9, color: "#1A1A1A", marginTop: 3, opacity: 0.7 }}>
              SCAN TO VERIFY PRE-HIRE CHECK STATUS
            </Text>
          </View>

          {/* Bottom edge - dark strip for sticker effect */}
          <View
            style={{
              backgroundColor: "#1A1A1A",
              paddingVertical: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 8, color: "#6B7280", letterSpacing: 1 }}>
              DIGGERSAFE.COM.AU
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            <MaterialIcons name="print" size={16} color={colors.muted} />
            <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 6 }}>
              Print on weather-resistant label stock
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="qr-code-scanner" size={16} color={colors.muted} />
            <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 6 }}>
              Scan with DiggerSafe app to start inspection
            </Text>
          </View>
        </View>

        {/* Print Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 14,
            paddingVertical: 16,
            marginTop: 24,
            marginHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name="print" size={20} color="#1A1A1A" />
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#1A1A1A", marginLeft: 8 }}>
            Print Sticker
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
