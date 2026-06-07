import { useCallback, useState } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import QRCode from "react-native-qrcode-svg";

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
      <View style={{ flex: 1 }}>
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
          QR Tag
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 4, marginBottom: 32 }}>
          Print and attach this QR code to the machine
        </Text>

        {/* QR Code Card */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            padding: 32,
            alignItems: "center",
            alignSelf: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <QRCode
            value={qrData}
            size={200}
            color="#1A1A1A"
            backgroundColor="#FFFFFF"
          />
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1A1A1A", marginTop: 20 }}>
            {machine.assetId}
          </Text>
          <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
            {machine.makeModel}
          </Text>
          <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2, fontFamily: "monospace" }}>
            S/N: {machine.serialNumber}
          </Text>
        </View>

        <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center", marginTop: 20 }}>
          Scan this code with the app to quickly open machine details
        </Text>
      </View>
    </ScreenContainer>
  );
}
