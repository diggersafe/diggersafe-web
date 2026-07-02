import { useCallback, useRef, useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import QRCode from "react-native-qrcode-svg";
import { Image } from "expo-image";
import * as Print from "expo-print";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getMachines, getSettings, type Machine } from "@/lib/store";

export default function QRTagScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [allMachines, setAllMachines] = useState<Machine[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [companyName, setCompanyName] = useState("");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const machines = await getMachines();
        const found = machines.find((m) => m.id === id);
        setMachine(found || null);
        setAllMachines(machines);
        const settings = await getSettings();
        setCompanyName(settings.companyName || "");
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

  const qrUrl = `https://diggersafe.com/inspect/${machine.id}?company=${encodeURIComponent(companyName)}`;

  function stickerHtml(m: Machine): string {
const url = `https://diggersafe.com/inspect/${m.id}?company=${encodeURIComponent(companyName)}`;
    return `
      <div style="width:264px;border:3px solid #F5C518;border-radius:20px;padding:20px;margin:10px auto;text-align:center;font-family:sans-serif;page-break-inside:avoid;">
        <div style="font-size:20px;font-weight:900;margin-bottom:4px;">
          <span style="color:#4CAF50;">Digger</span><span style="color:#1A1A1A;">Safe</span>
        </div>
        <p style="font-size:8px;color:#666;letter-spacing:2px;margin:0 0 12px;">FLEET & SAFETY</p>
        <div style="border:4px solid #F5C518;border-radius:12px;padding:10px;display:inline-block;background:#fff;margin-bottom:12px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}" width="160" height="160"/>
        </div>
        <p style="font-size:20px;font-weight:900;color:#1A1A1A;margin:4px 0;">${m.assetId}</p>
        <p style="font-size:13px;color:#555;margin:2px 0;">${m.makeModel}</p>
        <p style="font-size:10px;color:#888;font-family:monospace;margin:4px 0;">S/N: ${m.serialNumber}</p>
        <div style="background:#F5C518;border-radius:8px;padding:10px;margin-top:10px;">
          <p style="font-size:14px;font-weight:900;color:#1A1A1A;margin:0;">✅ BE WORKSAFE</p>
          <p style="font-size:8px;color:#1A1A1A;margin:4px 0 0;">SCAN TO VERIFY Pre-Start CHECK STATUS</p>
        </div>
        <p style="font-size:7px;color:#aaa;margin-top:8px;">DIGGERSAFE.COM</p>
      </div>`;
  }

  async function printThis() {
    setIsPrinting(true);
    try {
      const html = `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#fff;">${stickerHtml(machine!)}</body></html>`;
      await Print.printAsync({ html });
    } catch {
      Alert.alert("Print Failed", "Could not open printer. Please try again.");
    } finally {
      setIsPrinting(false);
    }
  }

  async function printAll() {
    setIsPrinting(true);
    try {
      const all = allMachines.map((m) => stickerHtml(m)).join("");
      const html = `<!DOCTYPE html><html><head><style>body{margin:0;padding:20px;background:#fff;}.grid{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;}</style></head><body><div class="grid">${all}</div></body></html>`;
      await Print.printAsync({ html });
    } catch {
      Alert.alert("Print Failed", "Could not open printer. Please try again.");
    } finally {
      setIsPrinting(false);
    }
  }

  function handlePrint() {
    Alert.alert(
      "Print QR Sticker",
      "What would you like to print?",
      [
        { text: "This Machine Only", onPress: printThis },
        { text: `All Machines (${allMachines.length})`, onPress: printAll },
        { text: "Cancel", style: "cancel" },
      ]
    );
  }

  return (
    <ScreenContainer className="px-4 pt-2" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
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

        <View style={{ alignSelf: "center", width: 300, borderRadius: 24, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 }}>
          <View style={{ backgroundColor: "#1A1A1A", paddingVertical: 16, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", borderBottomWidth: 3, borderBottomColor: "#F5C518" }}>
            <Image source={require("@/assets/images/icon.png")} style={{ width: 36, height: 36, borderRadius: 8, marginRight: 10 }} />
            <View>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#FFFFFF" }}>
                <Text style={{ color: "#4CAF50" }}>Digger</Text>
                <Text style={{ color: "#FFFFFF" }}>Safe</Text>
              </Text>
              <Text style={{ fontSize: 9, color: "#9CA3AF", letterSpacing: 2, fontWeight: "600" }}>FLEET & SAFETY</Text>
            </View>
          </View>

          <View style={{ backgroundColor: "#FFFFFF", paddingVertical: 24, paddingHorizontal: 20, alignItems: "center" }}>
            <View style={{ borderWidth: 4, borderColor: "#F5C518", borderRadius: 16, padding: 12, backgroundColor: "#FFFFFF" }}>
              <QRCode value={qrUrl} size={160} color="#1A1A1A" backgroundColor="#FFFFFF" />
            </View>
            <View style={{ marginTop: 16, alignItems: "center" }}>
              <Text style={{ fontSize: 22, fontWeight: "900", color: "#1A1A1A", letterSpacing: 1 }}>{machine.assetId}</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#4B5563", marginTop: 4 }}>{machine.makeModel}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, backgroundColor: "#F3F4F6", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                <MaterialIcons name="tag" size={12} color="#6B7280" />
                <Text style={{ fontSize: 11, color: "#6B7280", marginLeft: 4, fontFamily: "monospace" }}>{machine.serialNumber}</Text>
              </View>
            </View>
          </View>

          <View style={{ backgroundColor: "#F5C518", paddingVertical: 14, paddingHorizontal: 20, alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="verified" size={18} color="#1A1A1A" />
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#1A1A1A", marginLeft: 6, letterSpacing: 1.5 }}>BE WORKSAFE</Text>
            </View>
            <Text style={{ fontSize: 9, color: "#1A1A1A", marginTop: 3, opacity: 0.7 }}>SCAN TO VERIFY Pre-Start CHECK STATUS</Text>
          </View>

          <View style={{ backgroundColor: "#1A1A1A", paddingVertical: 8, alignItems: "center" }}>
            <Text style={{ fontSize: 8, color: "#6B7280", letterSpacing: 1 }}>DIGGERSAFE.COM</Text>
          </View>
        </View>

        <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
            <MaterialIcons name="print" size={16} color={colors.muted} />
            <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 6 }}>Print on weather-resistant label stock</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons name="qr-code-scanner" size={16} color={colors.muted} />
            <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 6 }}>Scan with any camera to start inspection</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePrint}
          disabled={isPrinting}
          style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, marginTop: 24, marginHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", opacity: isPrinting ? 0.7 : 1 }}
        >
          {isPrinting ? (
            <ActivityIndicator color="#1A1A1A" />
          ) : (
            <>
              <MaterialIcons name="print" size={20} color="#1A1A1A" />
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#1A1A1A", marginLeft: 8 }}>Print Sticker</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
